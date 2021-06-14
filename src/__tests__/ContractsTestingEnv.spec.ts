import ContractsTestingEnv from "../tools/ContractsTestingEnv";

describe("ContractTestingEnv", () => {
  const contract1 = "./src/examples/example-contract-1.ts";
  const contract2 = "./src/examples/example-contract-2.ts";

  it("should properly deploy contracts with initial state", () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});
    const contract2Id = testEnv.deployContract(contract2, {text: "init"});

    expect(testEnv.readContract(contract1Id)).toEqual({counter: 5});
    expect(testEnv.readContract(contract2Id)).toEqual({text: "init"});
    expect(contract1Id).toContain("TEST-");
    expect(contract2Id).toContain("TEST-");
  });

  it("should return 'state' object when interacting with contract", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});
    const contract2Id = testEnv.deployContract(contract2, {text: "init"});

    const result = await testEnv.interact("test-caller", contract1Id, {"function": "add"});
    expect(result).toEqual({ type: 'ok', result: undefined, state: { counter: 6 } });

    const result2 = await testEnv.interact("test-caller", contract2Id, {"function": "add"});
    expect(result2).toEqual({type: 'ok', result: undefined, state: {text: 'init value'}});
  });

  it("should return 'result' object when reading contract data", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});
    const contract2Id = testEnv.deployContract(contract2, {text: "init"});

    const result = await testEnv.interact("test-caller", contract1Id, {"function": "value"});
    expect(result).toEqual({ type: 'ok', result: 5, state: { counter: 5 } });

    const result2 = await testEnv.interact("test-caller", contract2Id, {"function": "value"});
    expect(result2).toEqual({ type: 'ok', result: 'init', state: { text: 'init' } });
  });

  it("should properly sent caller", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract2Id = testEnv.deployContract(contract2, {text: "init"});

    await expect(testEnv.interact("wrong-caller", contract2Id, {"function": "value"}))
      .rejects.toThrowError("wrong caller");
  });

  it("should properly set block height", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});

    const result = await testEnv.interact("test-caller", contract1Id, {"function": "blockHeight"}, {height: 554});
    expect(result).toEqual({ type: 'ok', result: 554, state: { counter: 5 } });
  });

  it("should allow to overwrite current state", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});

    const result = await testEnv.interact("test-caller", contract1Id, {"function": "add"}, null, {counter: 666} );
    expect(result).toEqual({ type: 'ok', result: undefined, state: { counter: 667 } });
  });

  it("should remember previous states", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});

    await testEnv.interact("test-caller", contract1Id, {"function": "add"});
    await testEnv.interact("test-caller", contract1Id, {"function": "add"});
    await testEnv.interact("test-caller", contract1Id, {"function": "add"});
    await testEnv.interact("test-caller", contract1Id, {"function": "add"});
    await testEnv.interact("test-caller", contract1Id, {"function": "add"});

    expect(testEnv.history(contract1Id)).toEqual(
      [
        { counter: 5 },
        { counter: 6 },
        { counter: 7 },
        { counter: 8 },
        { counter: 9 },
        { counter: 10 }
      ]);
  });

  it("should clear contract's state", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});

    await testEnv.interact("test-caller", contract1Id, {"function": "add"});
    await testEnv.interact("test-caller", contract1Id, {"function": "add"});
    expect(testEnv.history(contract1Id)).toEqual(
      [
        { counter: 5 },
        { counter: 6 },
        { counter: 7 },
      ]);
    testEnv.clearState(contract1Id);
    expect(testEnv.history(contract1Id)).toEqual([]);
  });

  it("should allow to read other contract's data", async () => {
    const testEnv: ContractsTestingEnv = new ContractsTestingEnv();
    const contract1Id = testEnv.deployContract(contract1, {counter: 5});
    const contract2Id = testEnv.deployContract(contract2, {text: "init"});

    const interaction = await testEnv.interact("test-caller", contract1Id, {"function": "readContract2", "contractId": contract2Id});
    expect(interaction.result).toEqual({"text": "init"});
  });
});
