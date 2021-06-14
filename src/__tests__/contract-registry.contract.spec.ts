import ContractsTestingEnv from "../tools/ContractsTestingEnv";
import {ContractsRegistryInput} from "../contracts-registry/types";

const contractSrcPath = "./src/contracts-registry/contracts-registry.contract.ts";

const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"
const initialState = {
  contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"]
};

describe("Contracts Registry Contract", () => {

  const testEnv = new ContractsTestingEnv();
  let contractId: string

  beforeEach(() => {
    contractId = testEnv.deployContract(contractSrcPath, initialState);
  });

  afterEach(() => {
    testEnv.clearContracts();
  });

  describe("registerContracts function", () => {

    describe("when no version supplied in input", () => {
      it("registers new contracts (no version in state)", async () => {
        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "providers-registry": "ar-tx-1",
                "disputes": "ar-tx-2",
              },
              comment: "initial deploy"
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            }
          }
        );
      });

      it("registers new contracts in the most recent version", async () => {
        testEnv.pushState(contractId, {
          contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          versions: {
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            }
          }
        });

        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "providers-registry": "ar-tx-3",
                "disputes": "ar-tx-4",
              },
              comment: "next deploy"
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1", "ar-tx-3"],
                "disputes": ["ar-tx-2", "ar-tx-4"]
              }
            }
          }
        );
      });

      it("registers new contracts in the most recent version (multiple versions in state)", async () => {
        testEnv.pushState(contractId, {
          contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          versions: {
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            },
            "v8": {
              "comment": "v8 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-10"],
                "disputes": ["ar-tx-12"]
              }
            },
            "v7": {
              "comment": "v7 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-5"],
                "disputes": ["ar-tx-6"]
              }
            }
          }
        });

        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "providers-registry": "ar-tx-14",
                "disputes": "ar-tx-16",
              },
              comment: "next deploy"
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            },
            "v8": {
              "comment": "v8 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-10", "ar-tx-14"],
                "disputes": ["ar-tx-12", "ar-tx-16"]
              }
            },
            "v7": {
              "comment": "v7 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-5"],
                "disputes": ["ar-tx-6"]
              }
            }
          }
        );
      });

      it("registers new single contract in the most recent version", async () => {
        testEnv.pushState(contractId, {
          contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          versions: {
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            }
          }
        });

        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "disputes": "ar-tx-666",
              },
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2", "ar-tx-666"]
              }
            }
          }
        );
      });
    });

    describe("when version was supplied in input", () => {
      it("registers new contracts (no version in state)", async () => {
        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "providers-registry": "ar-tx-1",
                "disputes": "ar-tx-2",
              },
              comment: "initial deploy",
              version: "v2"
            },
          });

        expect(interaction.state.versions).toEqual({
            "v2": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            }
          }
        );
      });

      it("registers new contracts in the most recent version", async () => {
        testEnv.pushState(contractId, {
          contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          versions: {
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            }
          }
        });

        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "providers-registry": "ar-tx-3",
                "disputes": "ar-tx-4",
              },
              version: "v1",
              comment: "next deploy"
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1", "ar-tx-3"],
                "disputes": ["ar-tx-2", "ar-tx-4"]
              }
            }
          }
        );
      });

      it("registers new contracts in the most recent version (multiple versions in state)", async () => {
        testEnv.pushState(contractId, {
          contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          versions: {
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            },
            "v8": {
              "comment": "v8 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-10"],
                "disputes": ["ar-tx-12"]
              }
            },
            "v7": {
              "comment": "v7 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-5"],
                "disputes": ["ar-tx-6"]
              }
            }
          }
        });

        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "providers-registry": "ar-tx-14",
                "disputes": "ar-tx-16",
              },
              version: "v8",
              comment: "next deploy"
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            },
            "v8": {
              "comment": "v8 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-10", "ar-tx-14"],
                "disputes": ["ar-tx-12", "ar-tx-16"]
              }
            },
            "v7": {
              "comment": "v7 deploy",
              "deployedBlockHeight": 2000,
              "contracts": {
                "providers-registry": ["ar-tx-5"],
                "disputes": ["ar-tx-6"]
              }
            }
          }
        );
      });

      it("registers new single contract in the most recent version", async () => {
        testEnv.pushState(contractId, {
          contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          versions: {
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            }
          }
        });

        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "disputes": "ar-tx-666",
              },
              version: "v1"
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2", "ar-tx-666"]
              }
            }
          }
        );
      });

      it("registers contracts in the new version", async () => {
        testEnv.pushState(contractId, {
          contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          versions: {
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            }
          }
        });

        const interaction = await testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "registerContracts",
            data: {
              contracts: {
                "providers-registry": "ar-tx-665",
                "disputes": "ar-tx-666",
              },
              version: "v2"
            }
          });

        expect(interaction.state.versions).toEqual({
            "v1": {
              "comment": "initial deploy",
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-1"],
                "disputes": ["ar-tx-2"]
              }
            },
            "v2": {
              "deployedBlockHeight": 1000,
              "contracts": {
                "providers-registry": ["ar-tx-665"],
                "disputes": ["ar-tx-666"]
              }
            }
          }
        );
      });
    });

    it("throws if caller is not an admin", async () => {
      await expect(testEnv.interact<ContractsRegistryInput>("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ", contractId,
        {
          function: "registerContracts",
          data: {
            contracts: {
              "providers-registry": "ar-tx-1",
              "disputes": "ar-tx-2",
            },
            comment: "initial deploy",
            version: "v2"
          },
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("throws if version is sent in wrong format ", async () => {
      await expect(testEnv.interact<ContractsRegistryInput>(caller, contractId,
        {
          function: "registerContracts",
          data: {
            contracts: {
              "providers-registry": "ar-tx-1",
            },
            comment: "initial deploy",
            version: "2"
          },
        })).rejects.toThrowError("Wrong version format - should be 'v[number]'");

      await expect(testEnv.interact<ContractsRegistryInput>(caller, contractId,
        {
          function: "registerContracts",
          data: {
            contracts: {
              "providers-registry": "ar-tx-1",
            },
            comment: "initial deploy",
            version: "version2"
          },
        })).rejects.toThrowError("Wrong version format - should be 'v[number]'");

      await expect(testEnv.interact<ContractsRegistryInput>(caller, contractId,
        {
          function: "registerContracts",
          data: {
            contracts: {
              "providers-registry": "ar-tx-1",
            },
            comment: "initial deploy",
            version: "v 2"
          },
        })).rejects.toThrowError("Wrong version format - should be 'v[number]'");

      await expect(testEnv.interact<ContractsRegistryInput>(caller, contractId,
        {
          function: "registerContracts",
          data: {
            contracts: {
              "providers-registry": "ar-tx-1",
            },
            comment: "initial deploy",
            version: "v_2"
          },
        })).rejects.toThrowError("Wrong version format - should be 'v[number]'");

      await expect(testEnv.interact<ContractsRegistryInput>(caller, contractId,
        {
          function: "registerContracts",
          data: {
            contracts: {
              "providers-registry": "ar-tx-1",
            },
            comment: "initial deploy",
            version: "v02"
          },
        })).rejects.toThrowError("Wrong version format - should be 'v[number]'");

    });

  });

  describe("contractsCurrentTxId function", () => {
    beforeEach(() => {
      testEnv.pushState(contractId, {
        contractAdmins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
        versions: {
          "v1": {
            "comment": "initial deploy",
            "deployedBlockHeight": 1000,
            "contracts": {
              "providers-registry": ["ar-tx-1"],
              "disputes": ["ar-tx-2"]
            }
          },
          "v8": {
            "comment": "v8 deploy",
            "deployedBlockHeight": 2000,
            "contracts": {
              "providers-registry": ["ar-tx-10"],
              "disputes": ["ar-tx-12"]
            }
          },
          "v7": {
            "comment": "v7 deploy",
            "deployedBlockHeight": 2000,
            "contracts": {
              "providers-registry": ["ar-tx-5"],
              "disputes": ["ar-tx-6"]
            }
          }
        }
      });
    });

    describe("when no version supplied in input", () => {
      it("returns txIds for contracts from latest version", async () => {
        const interaction = await testEnv.interact(caller, contractId, {
          function: "contractsCurrentTxId",
          data: {
            contractNames: ["providers-registry", "disputes"]
          }
        });

        expect(interaction.result).toEqual(
          {"providers-registry": "ar-tx-10", "disputes": "ar-tx-12"}
        );
      });

      it("returns txId for single contract from latest version", async () => {
        const interaction = await testEnv.interact(caller, contractId, {
          function: "contractsCurrentTxId",
          data: {
            contractNames: ["providers-registry"]
          }
        });

        expect(interaction.result).toEqual(
          {"providers-registry": "ar-tx-10"}
        );
      });
    });

    describe("when version supplied in input", () => {
      it("returns txIds for contracts from given version", async () => {
        const interaction = await testEnv.interact(caller, contractId, {
          function: "contractsCurrentTxId",
          data: {
            contractNames: ["providers-registry", "disputes"],
            version: "v7"
          }
        });

        expect(interaction.result).toEqual(
          {"providers-registry": "ar-tx-5", "disputes": "ar-tx-6"}
        );
      });

      it("returns txId for single contract from given version", async () => {
        const interaction = await testEnv.interact(caller, contractId, {
          function: "contractsCurrentTxId",
          data: {
            contractNames: ["providers-registry"],
            version: "v1"
          }
        });

        expect(interaction.result).toEqual(
          {"providers-registry": "ar-tx-1"}
        );
      });

      it("throws if version not registered in contract", async () => {
        await expect(testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "contractsCurrentTxId",
            data: {
              contractNames: ["providers-registry"],
              version: "v5"
            },
          })).rejects.toThrowError("No such version v5.");

      });

      it("throws if contract not registered for given version", async () => {
        await expect(testEnv.interact<ContractsRegistryInput>(caller, contractId,
          {
            function: "contractsCurrentTxId",
            data: {
              contractNames: ["play-drums"],
              version: "v1"
            },
          })).rejects.toThrowError("Contract play-drums is not defined for version v1.");

      });
    });
  });

});
