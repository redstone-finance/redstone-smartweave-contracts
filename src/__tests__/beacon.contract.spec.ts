import ContractsTestingEnv from "../tools/ContractsTestingEnv";
import {BeaconInput} from "../beacon/types";

const contractSrcPath = "./src/beacon/beacon.contract.ts";

const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"
const otherCaller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ"
const initialState = `{
  "contractAdmins": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"]
}`

describe("Beacon Contract", () => {

  const testEnv = new ContractsTestingEnv();
  let contractId: string

  beforeEach(() => {
    contractId = testEnv.deployContract(contractSrcPath, JSON.parse(initialState));
  });

  afterEach(() => {
    testEnv.clearContracts();
  });

  describe("register-contract function", () => {
    it("registers new contract", async () => {
      const interaction = await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        });

      expect(interaction.state).toEqual({
        contractAdmins: ['bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY'],
        contracts: {
          'providers-registry': ['VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ']
        }
      });
    });

    it("throws if profile has no privileges", async () => {
      await expect(testEnv.interact<BeaconInput>(otherCaller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        }))
        .rejects
        .toThrowError("No privileges to register new contract.")
    });

    it("throws if contract is already registered", async () => {
      await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        });

      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        }))
        .rejects
        .toThrowError("Contract with name 'providers-registry' already registered.")
    });

    it("throws if contract name not defined", async () => {
      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        }))
        .rejects
        .toThrowError("Contract name not defined.")
    });

    it("throws if contract transaction id not defined", async () => {
      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "providers-registry",
            contractTxId: ""
          }
        }))
        .rejects
        .toThrowError("Contract transaction id not defined.")
    });


  });

  describe("add-contract-version function", () => {
    beforeEach(async () => {
      await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        });
    });

    it("adds new version to an existing contract", async () => {
      const interaction = await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "add-contract-version",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ-1"
          }
        });

      expect(interaction.state).toEqual({
        contractAdmins: ['bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY'],
        contracts: {
          'providers-registry': ['VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ', 'VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ-1']
        }
      });
    });

    it("throws if profile has no privileges", async () => {
      await expect(testEnv.interact<BeaconInput>(otherCaller, contractId,
        {
          function: "add-contract-version",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ-1"
          }
        }))
        .rejects
        .toThrowError("No privileges to register new contract.")
    });

    it("throws if contract is not registered", async () => {
      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "add-contract-version",
          data: {
            contractName: "providers-registryyyy",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ-1"
          }
        }))
        .rejects
        .toThrowError("Contract with name 'providers-registryyyy' not registered.")
    });

    it("throws if contract name not defined", async () => {
      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "add-contract-version",
          data: {
            contractName: "",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        }))
        .rejects
        .toThrowError("Contract name not defined.")
    });

    it("throws if contract transaction id not defined", async () => {
      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "add-contract-version",
          data: {
            contractName: "providers-registry",
            contractTxId: ""
          }
        }))
        .rejects
        .toThrowError("Contract transaction id not defined.")
    });


  });

  describe("contract-current-tx-id function", () => {
    beforeEach(async () => {
      await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "register-contract",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ"
          }
        });
    });

    it("returns current contract transaction id - one contract version", async () => {
      const interaction = await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "contract-current-tx-id",
          data: {
            contractName: "providers-registry"
          }
        });

      expect(interaction.result).toEqual({
        contractTxId: 'VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ'
      });
    });

    it("returns current contract transaction id - multiple contract versions", async () => {
      await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "add-contract-version",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ-2"
          }
        });
      await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "add-contract-version",
          data: {
            contractName: "providers-registry",
            contractTxId: "VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ-3"
          }
        });

      const interaction = await testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "contract-current-tx-id",
          data: {
            contractName: "providers-registry"
          }
        });

      expect(interaction.result).toEqual({
        contractTxId: 'VTbkAHJLshFi0v0uDD-af8ldoOjxge0J8s1yZMIIoTQ-3'
      });
    });

    it("throws if contract is not registered", async () => {
      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "contract-current-tx-id",
          data: {
            contractName: "providers-registryyyy"
          }
        }))
        .rejects
        .toThrowError("Contract with name 'providers-registryyyy' not registered.")
    });

    it("throws if contract name not defined", async () => {
      await expect(testEnv.interact<BeaconInput>(caller, contractId,
        {
          function: "contract-current-tx-id",
          data: {
            contractName: "",
          }
        }))
        .rejects
        .toThrowError("Contract name not defined.")
    });

  });

});
