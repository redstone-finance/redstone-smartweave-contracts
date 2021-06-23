import ContractsTestingEnv, {Contract} from "../tools/ContractsTestingEnv";
import {registryTxId} from "../common/ContractInteractions";
import {TokenInput} from "../token/types";

describe("Token Contract", () => {

  const provider = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY";
  const sponsor = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_AxBBed";

  const providersContract: Contract = {
    src: "./src/providers-registry/providers-registry.contract.ts",
    txId: "providersContractTxId",
    initialState: {
      "trace": true,
      "readonly": false,
      "contractAdmins": [provider],
      "providers": {
        [provider]: {
          "adminsPool": [provider],
          "profile": {
            "name": "Test",
            "description": "test",
            "url": "test",
            "id": "testId"
          },
          "manifests": [
            {
              "changeMessage": "initial manifest",
              "lockedHours": 0,
              "manifestTxId": "mTxId"
            }
          ],
          "registerHeight": 706749
        },
      },
      availableTokens: {}
    }
  }

  const tokenContract: Contract = {
    src: "./src/token/token.contract.ts",
    txId: "tokenContractTxId",
    initialState: {
      "ticker": "R_TEST",
      "balances": {
        [provider]: 1000,
        [sponsor]: 2000
      }
    }
  }

  const registryContract: Contract = {
    src: "./src/contracts-registry/contracts-registry.contract.ts",
    txId: registryTxId,
    initialState: {
      contractAdmins: [provider],
      versions: {
        "v1": {
          comment: "initial deploy",
          deployedBlockHeight: 706747,
          contracts: {
            "providers-registry": [providersContract.txId],
            "token": [tokenContract.txId]
          }
        }
      }
    }
  }

  const testEnv = new ContractsTestingEnv();

  beforeEach(() => {
    testEnv.deploy(registryContract);
    testEnv.deploy(providersContract);
    testEnv.deploy(tokenContract);
  });

  afterEach(() => {
    testEnv.clearContracts();
  });

  describe("deposit function", () => {
    it("should throw if qty <= 0", async () => {
      await expect(testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: -1
          }
        })).rejects.toThrowError("Deposit quantity should be a positive value.");

      await expect(testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 0
          }
        })).rejects.toThrowError("Deposit quantity should be a positive value.");

    });

    it("should throw if qty > balance", async () => {
      await expect(testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 1001
          }
        })).rejects.toThrowError("Not enough tokens in wallet bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY.");
    });

    it("should deposit requested amount of tokens (caller same as target)", async () => {
      const interaction = await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 500
          }
        });

      expect(interaction.state.contractDeposits).toEqual({
        "providers-registry": {
          "deposit": 500,
          "withdraw": 0,
          "wallets": {
            [provider]: {
              "deposit": 500,
              "withdraw": 0,
              "log": [{
                "from": provider,
                "qty": 500,
                "timestamp": 5555
              }]
            }
          }
        }
      });
      expect(interaction.state.balances[provider]).toEqual(500);
      expect(interaction.state.balances[sponsor]).toEqual(2000);
    });

    it("should deposit requested amount of tokens (caller and target different)", async () => {
      const interaction = await testEnv.interact<TokenInput>(
        sponsor,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 700
          }
        });

      expect(interaction.state.contractDeposits).toEqual({
        "providers-registry": {
          "deposit": 700,
          "withdraw": 0,
          "wallets": {
            [provider]: {
              "deposit": 700,
              "withdraw": 0,
              "log": [{
                "from": sponsor,
                "qty": 700,
                "timestamp": 5555
              }]
            }
          }
        }
      });
      expect(interaction.state.balances[provider]).toEqual(1000);
      expect(interaction.state.balances[sponsor]).toEqual(1300);
    });

    it("should properly sum amount of all deposits", async () => {
      await testEnv.interact<TokenInput>(
        sponsor,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 700
          }
        });

      const interaction = await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 200
          }
        }, {timestamp: 6666, height: 120});

      expect(interaction.state.contractDeposits).toEqual({
        "providers-registry": {
          "deposit": 900,
          "withdraw": 0,
          "wallets": {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY": {
              "deposit": 900,
              "withdraw": 0,
              "log": [{
                "from": "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_AxBBed",
                "qty": 700,
                "timestamp": 5555
              }, {
                "from": "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
                "qty": 200,
                "timestamp": 6666
              }]
            }
          }
        }
      });
      expect(interaction.state.balances[provider]).toEqual(800);
      expect(interaction.state.balances[sponsor]).toEqual(1300);
    });
  });

  describe("withdraw function", () => {
    it("should throw if qty >= 0", async () => {
      await expect(testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 0
          }
        })).rejects.toThrowError("Withdraw quantity should be a negative value.");

      await expect(testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 1
          }
        })).rejects.toThrowError("Withdraw quantity should be a negative value.");
    });

    it("should withdraw requested if qty <= tokens available for withdraw", async () => {
      // given
      await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 700
          }
        });

      const providersState = testEnv.readState(providersContract.txId);
      testEnv.pushState(providersContract.txId, {
        ...providersState,
        availableTokens: {
          [provider]: 350
        }
      });

      // when
      const interaction = await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: -349
          }
        });

      expect(interaction.state.contractDeposits).toEqual(
        {
          "providers-registry": {
            "deposit": 700,
            "withdraw": 349,
            "wallets": {
              "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY": {
                "deposit": 700,
                "withdraw": 349,
                "log": [{"from": "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY", "qty": 700, "timestamp": 5555}]
              }
            }
          }
        });
      expect(interaction.state.balances[provider]).toEqual(649); // 1000(initial) - 350(deposit) + 349 (withdraw)

    });

    it("should properly sum the amount of all withdraws", async () => {
      // given
      await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 700
          }
        });

      const providersState = testEnv.readState(providersContract.txId);
      testEnv.pushState(providersContract.txId, {
        ...providersState,
        availableTokens: {
          [provider]: 350
        }
      });

      // when
      await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: -120
          }
        });
      const interaction = await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: -200
          }
        });

      expect(interaction.state.contractDeposits).toEqual({
        "providers-registry": {
          "deposit": 700,
          "withdraw": 320,
          "wallets": {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY": {
              "deposit": 700,
              "withdraw": 320,
              "log": [{"from": "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY", "qty": 700, "timestamp": 5555}]
            }
          }
        }
      });

      // 1000(initial) - 700(deposit) + 120 (withdraw 1) + 200 (withdraw 2)
      expect(interaction.state.balances[provider]).toEqual(620);

    });

    it("should lower the withdraw amount to the available amount", async () => {
      // given
      await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 700
          }
        });

      const providersState = testEnv.readState(providersContract.txId);
      testEnv.pushState(providersContract.txId, {
        ...providersState,
        availableTokens: {
          [provider]: 100
        }
      });

      // when
      const interaction = await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: -148
          }
        });

      expect(interaction.state.contractDeposits).toEqual({
        "providers-registry": {
          "deposit": 700,
          "withdraw": 100,
          "wallets": {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY": {
              "deposit": 700,
              "withdraw": 100,
              "log": [{"from": "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY", "qty": 700, "timestamp": 5555}]
            }
          }
        }
      });

      // 1000(initial) - 700(deposit) + 100 ("effective" withdraw)
      expect(interaction.state.balances[provider]).toEqual(400);

    });

    it("should lower the available amount by the sum of the withdraws", async () => {
      // given
      await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "deposit",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: 700
          }
        });

      const providersState = testEnv.readState(providersContract.txId);
      testEnv.pushState(providersContract.txId, {
        ...providersState,
        availableTokens: {
          [provider]: 200
        }
      });

      // when
      await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            qty: -150
          }
        });


      const interaction = await testEnv.interact<TokenInput>(
        provider,
        tokenContract.txId,
        {
          function: "withdraw",
          data: {
            contractName: "providers-registry",
            targetId: provider,
            // note: this should be lowered to 50 (so "total" withdraw at this point should be 200, not 150 + 199),
            // even though "available tokens" is set to 200 - as we've already withdrawn 150 in the previous interaction.
            qty: -199
          }
        });

      expect(interaction.state.contractDeposits).toEqual({
        "providers-registry": {
          "deposit": 700,
          "withdraw": 200,
          "wallets": {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY": {
              "deposit": 700,
              "withdraw": 200,
              "log": [{"from": "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY", "qty": 700, "timestamp": 5555}]
            }
          }
        }
      });

      // 1000(initial) - 700(deposit) + 200 ("effective" withdraw)
      expect(interaction.state.balances[provider]).toEqual(500);

    });

  });

});
