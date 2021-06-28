import ContractsTestingEnv from "../tools/ContractsTestingEnv";
import { ProvidersRegistryInput } from "../providers-registry/types";
import { ContractsRegistryInput } from "../contracts-registry/types";
import { registryTxId } from "../common/ContractInteractions";

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";
const tokenContractSrcPath = "./src/token/token.contract.ts";
const tokenContractTxId = "tokenContractTxId";
const registryContractSrcPath = "./src/contracts-registry/contracts-registry.contract.ts";

const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"
const initialState = `{
  "trace": false,
  "readonly": false,
  "contractAdmins": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"]
}`

describe("Provider Registry Contract", () => {

  const testEnv = new ContractsTestingEnv();
  let providersContractId: string

  beforeEach(() => {
    providersContractId = testEnv.deployContract(contractSrcPath, JSON.parse(initialState));
  });

  afterEach(() => {
    testEnv.clearContracts();
  });

  async function deployContractsRegistry() {
    testEnv.deployContract(registryContractSrcPath, {
      contractAdmins: [caller]
    }, registryTxId);
    await testEnv.interact<ContractsRegistryInput>(caller, registryTxId,
      {
        function: "registerContracts",
        data: {
          contracts: {
            "providers-registry": providersContractId,
            "token": tokenContractTxId
          },
          comment: "initial deploy"
        }
      });
  }

  describe("registerProvider function", () => {
    it("registers new provider without manifest", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });

      expect(interaction.state.providers).toEqual({
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY": {
          "adminsPool": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          "manifests": [],
          "profile": {
            "name": "test-provider-1",
            "description": "desc-1",
            "url": "https://test-provider-1.ok",
            "id": "provider_TX-ID-1000"
          },
          "registerHeight": 1000
        }
      }
      );
    });

    it("registers new provider with manifest", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
              "manifests": [
                {
                  changeMessage: "initial add",
                  lockedHours: 6,
                  manifestTxId: "mft-tx-1"
                }
              ]
            }
          }
        });

      expect(interaction.state.providers).toEqual({
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY": {
          "adminsPool": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"],
          "profile": {
            "name": "test-provider-1",
            "description": "desc-1",
            "url": "https://test-provider-1.ok",
            "id": "provider_TX-ID-1000"
          },
          "manifests": [{
            "changeMessage": "initial add",
            "lockedHours": 6,
            "manifestTxId": "mft-tx-1"
          }],
          "registerHeight": 1000
        }
      });
    });

    it("throws if provider is already registered", async () => {
      await testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        }))
        .rejects
        .toThrowError("Provider for bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY is already registered.")
    });

    it("throws if provider with given name is already registered", async () => {
      await testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });

      await expect(testEnv.interact<ProvidersRegistryInput>("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111", providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        }))
        .rejects
        .toThrowError("Provider with test-provider-1 is already registered.")
    });

    it("throws if profile not set", async () => {
      const data = JSON.parse(`
      {
          "provider": {
            "adminsPool": []
          }
      }`
      );

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: data
        }))
        .rejects
        .toThrowError("Provider profile not defined")
    });

    it("throws if profile name not set", async () => {
      const data = JSON.parse(`
      {   
          "provider": {
            "adminsPool": [],
            "profile": {
              "description": "desc",
              "url": "url"
            }
          }
      }`
      );

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: data
        }))
        .rejects
        .toThrowError("Provider profile name not defined.")
    });

    it("throws if profile description not set", async () => {
      const data = JSON.parse(`
      {   
          "provider": {
            "adminsPool": [],
            "profile": {
              "name": "name",
              "url": "url"
            }
          }
      }`
      );

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: data
        }))
        .rejects
        .toThrowError("Provider profile description not defined.")
    });

    it("throws if profile url not set", async () => {
      const data = JSON.parse(`
      {   
          "provider": {
            "adminsPool": [],
            "profile": {
              "name": "name",
              "description": "desc"
            }
          }
      }`
      );

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: data
        }))
        .rejects
        .toThrowError("Provider profile url not defined.")
    });

  });

  describe("removeProvider function", () => {
    // adding two providers before execution of each test
    const user1 = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111";
    const user2 = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222";
    const nonProviderAdminUser = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222221";

    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        user1,
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });

      await testEnv.interact<ProvidersRegistryInput>(
        user2,
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-2",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });
    });

    it("removes provider with given provider id", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        user2,
        providersContractId,
        {
          function: "removeProvider",
          data: {
            providerId: user2
          }
        });

      expect(interaction.state.providers).toEqual(
        {
          "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
            "adminsPool": [user1],
            "profile": {
              "name": "test-provider-1",
              "description": "desc-1",
              "url": "https://test-provider-1.ok",
              "id": "provider_TX-ID-1000"
            },
            "manifests": [],
            "registerHeight": 1000
          }
        });
    });

    it("throws if providerId not set", async () => {

      const data = JSON.parse(`{}`);

      await expect(testEnv.interact<ProvidersRegistryInput>(
        user2,
        providersContractId,
        {
          function: "removeProvider",
          data
        }))
        .rejects
        .toThrowError("'providerId' field is required.")
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        user2,
        providersContractId,
        {
          function: "removeProvider",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.")
    });

    it("throws if caller has no privileges to provider ", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        nonProviderAdminUser,
        providersContractId,
        {
          function: "removeProvider",
          data: {
            providerId: user2
          }
        }))
        .rejects
        .toThrowError("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222221 is not an admin for bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222")
    });
  });

  describe("addProviderManifest function", () => {
    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });
    });

    it("adds manifest to a provider", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "addProviderManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            manifestData: {
              changeMessage: "initial add",
              lockedHours: 6,
              manifestTxId: "mft-tx-1"
            }
          }
        });

      expect(interaction.state.providers["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"].manifests).toEqual(
        [{
          "uploadBlockHeight": 1000,
          "manifestTxId": "mft-tx-1",
          "changeMessage": "initial add",
          "lockedHours": 0
        }]
      );
    });

    it("throws if providerId not set", async () => {

      const data = JSON.parse(`{}`);

      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        providersContractId,
        {
          function: "addProviderManifest",
          data
        }))
        .rejects
        .toThrowError("'providerId' field is required.");
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "addProviderManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.");
    });

    it("throws if caller has no privileges to provider", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112",
        providersContractId,
        {
          function: "addProviderManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }))
        .rejects
        .toThrowError("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112 is not an admin for bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111");
    });

    it("throws if manifest data is not set", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "addProviderManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }))
        .rejects
        .toThrowError("Manifest data not set.");
    });

    it("throws if manifest is not set", async () => {
      const manifestData = JSON.parse(`{
        "changeMessage": "omg"
      }`);
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "addProviderManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            manifestData: manifestData
          }
        }))
        .rejects
        .toThrowError("ManifestTxId not set.");
    });

    it("throws if change message not set", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "addProviderManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            manifestData: {
              manifestTxId: "mft-tx-44",
              changeMessage: ""
            }
          }
        }))
        .rejects
        .toThrowError("Change message is not set.");
    });

  });

  describe("addProviderAdmin function", () => {
    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });
    });

    it("throws if providerId not set", async () => {

      const data = JSON.parse(`{}`);

      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        providersContractId,
        {
          function: "addProviderAdmin",
          data
        }))
        .rejects
        .toThrowError("'providerId' field is required.");
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "addProviderAdmin",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.");
    });

    it("throws if caller has no privileges to provider", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112",
        providersContractId,
        {
          function: "addProviderAdmin",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }))
        .rejects
        .toThrowError("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112 is not an admin for bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111");
    });

    it("adds new admins for provider", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "addProviderAdmin",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            admins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333", "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_444444"]
          }
        });

      expect(interaction.state.providers["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"]).toEqual(
        {
          "adminsPool": [
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333",
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_444444"
          ],
          "profile": {
            "name": "test-provider-1",
            "description": "desc-1",
            "url": "https://test-provider-1.ok",
            "id": "provider_TX-ID-1000"
          },
          "manifests": [],
          "registerHeight": 1000
        }
      );
    });

  });

  describe("activeManifest function", () => {

    it("gets latest active manifest (1)", async () => {
      testEnv.pushState(
        providersContractId,
        {
          trace: true,
          contractAdmins: ["xxx"],
          providers: {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              manifests:
                [
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 12,
                    manifestTxId: "700_12"
                  },
                ]
            }
          }
        });

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        caller,
        providersContractId,
        {
          function: "activeManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        });

      expect(interaction.result).toEqual({
        "manifest": {
          "uploadBlockHeight": 700,
          "lockedHours": 12,
          "status": "active",
          "manifestTxId": "700_12"
        }
      });
    });

    it("gets latest active manifest (2)", async () => {
      testEnv.pushState(
        providersContractId,
        {
          trace: true,
          contractAdmins: ["xxx"],
          providers: {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              manifests:
                [
                  {
                    uploadBlockHeight: 500,
                    lockedHours: 12,
                    manifestTxId: "500_12"
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 12,
                    manifestTxId: "700_12"
                  },
                ]
            }
          }
        });

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        caller,
        providersContractId,
        {
          function: "activeManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        });

      expect(interaction.result).toEqual({
        "manifest": {
          "uploadBlockHeight": 500,
          "lockedHours": 12,
          "status": "active",
          "manifestTxId": "500_12"
        }
      });
    });

    it("gets latest active manifest (3)", async () => {
      testEnv.pushState(
        providersContractId,
        {
          trace: true,
          contractAdmins: ["xxx"],
          providers: {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              manifests:
                [
                  {
                    uploadBlockHeight: 500,
                    lockedHours: 12,
                    manifestTxId: "500_12"
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 6,
                    manifestTxId: "700_6"
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 12,
                    manifestTxId: "700_12"
                  },
                ]
            }
          }
        });

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        caller,
        providersContractId,
        {
          function: "activeManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        });

      expect(interaction.result).toEqual({
        "manifest": {
          "uploadBlockHeight": 700,
          "lockedHours": 6,
          "status": "active",
          "manifestTxId": "700_6"
        }
      });
    })

    it("gets latest active manifest with content for eagerManifestLoad", async () => {
      testEnv.contractEnv(providersContractId).swGlobal.unsafeClient.transactions.getData = jest.fn().mockImplementation((contractId) => {
        if (contractId == "700_6") {
          return `{"foo": "bar"}`;
        }
      });

      testEnv.pushState(
        providersContractId,
        {
          trace: true,
          contractAdmins: ["xxx"],
          providers: {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              manifests:
                [
                  {
                    uploadBlockHeight: 500,
                    lockedHours: 12,
                    manifestTxId: "500_12"
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 6,
                    manifestTxId: "700_6"
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 12,
                    manifestTxId: "700_12"
                  },
                ]
            }
          }
        });

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        caller,
        providersContractId,
        {
          function: "activeManifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            eagerManifestLoad: true
          }
        });

      expect(interaction.result).toEqual({
        "manifest": {
          "uploadBlockHeight": 700,
          "lockedHours": 6,
          "status": "active",
          "manifestTxId": "700_6",
          "activeManifestContent": {
            "foo": "bar",
            "txId": "700_6"
          }
        }
      });
    });


  });

  describe("providerData function", () => {

    beforeEach(async () => {
      testEnv.deployContract(tokenContractSrcPath, {
        ticker: "R_TEST",
        balances: {
          [caller]: 2000
        },
        contractDeposits: {
          "providers-registry": {
            total: 1000,
            wallets: {
              [caller]: {
                totalDeposit: 1000,
                totalWithdrawn: 300,
                log: {
                  from: caller,
                  qty: 1000,
                  timestamp: 555
                }
              }
            }
          }
        }
      }, tokenContractTxId);



      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok",
              },
              "manifests": [{
                "changeMessage": "initial",
                "lockedHours": 5,
                "manifestTxId": "mft-tx-5"
              }],
            }
          }
        });

    });

    it("throws if providerId not set", async () => {

      const data = JSON.parse(`{}`);

      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        providersContractId,
        {
          function: "providerData",
          data
        }))
        .rejects
        .toThrowError("'providerId' field is required.");
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "providerData",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.");
    });

    it("gets provider by provider id with calculated staked tokens", async () => {
      // given
      await deployContractsRegistry();

      testEnv.pushState(tokenContractTxId, {
        ...testEnv.readState(tokenContractTxId),
        contractDeposits: {
          "providers-registry": {
            "deposit": 3478,
            "withdraw": 378,
            "wallets": {
              "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
                "deposit": 3478,
                "withdraw": 378,
                "log": [{
                  "from": "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
                  "qty": 3478,
                  "timestamp": 5555
                }]
              }
            }
          }
        }
      });

      //when
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "providerData",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
          }
        });

      // then
      expect(interaction.result).toEqual(
        {
          "provider": {
            "adminsPool": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"],
            "profile": {
              "name": "test-provider-1",
              "description": "desc-1",
              "url": "https://test-provider-1.ok",
              "id": "provider_TX-ID-1000"
            },
            "manifests": [{
              "changeMessage": "initial",
              "lockedHours": 5,
              "manifestTxId": "mft-tx-5",
              "status": "active"
            }],
            "registerHeight": 1000,
            "stakedTokens": 3100
          }
        });
    });
  });

  describe("providersData function", () => {

    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok",
              },
              "manifests": [{
                "changeMessage": "initial",
                "lockedHours": 5,
                "manifestTxId": "mft-tx-5"
              }],
            }
          }
        });

      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112",
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-2",
                "description": "desc-2",
                "url": "https://test-provider-2.ok",
              },
              "manifests": [{
                "changeMessage": "initial",
                "lockedHours": 0,
                "manifestTxId": "mft-tx-5"
              },
              {
                "changeMessage": "initial 2",
                "lockedHours": 0,
                "manifestTxId": "mft-tx-7"
              }
              ],
            }
          }
        });
    });

    it("returns data of all providers", async () => {
      // given
      await deployContractsRegistry();

      // when
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "providersData",
          data: {}
        });

      // then
      expect(interaction.result).toEqual(
        {
          "providers": {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              "adminsPool": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok",
                "id": "provider_TX-ID-1000"
              },
              "manifests": [{
                "changeMessage": "initial",
                "lockedHours": 5,
                "manifestTxId": "mft-tx-5",
                "status": "active"
              }],
              "registerHeight": 1000,
              "stakedTokens": 0
            },
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112": {
              "adminsPool": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112"],
              "profile": {
                "name": "test-provider-2",
                "description": "desc-2",
                "url": "https://test-provider-2.ok",
                "id": "provider_TX-ID-1000"
              },
              "manifests": [{
                "changeMessage": "initial",
                "lockedHours": 0,
                "manifestTxId": "mft-tx-5",
                "status": "historical"
              }, {
                "changeMessage": "initial 2",
                "lockedHours": 0,
                "manifestTxId": "mft-tx-7",
                "status": "active"
              }],
              "registerHeight": 1000,
              "stakedTokens": 0
            }
          }
        }
      )
    });
  });

  describe("addContractAdmins function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        providersContractId,
        {
          function: "addContractAdmins",
          data: {
            admins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"]
          }
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("should add new contract admins", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        providersContractId,
        {
          function: "addContractAdmins",
          data: {
            admins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111", "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"]
          }
        });

      expect(interaction.state.contractAdmins).toEqual([
        'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY',
        'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111',
        'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333'
      ]);
    });
  });

  describe("switchTrace function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        providersContractId,
        {
          function: "switchTrace",
          data: {}
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("should switch trace state", async () => {
      const prevTraceState = testEnv.readState(providersContractId).trace

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        providersContractId,
        {
          function: "switchTrace",
          data: {}
        });

      expect(interaction.state.trace).toEqual(!prevTraceState);
    });
  });

  describe("switchReadonly function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        providersContractId,
        {
          function: "switchReadonly",
          data: {}
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("should switch readonly state", async () => {
      const prevReadonlyState = testEnv.readState(providersContractId).readonly

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        providersContractId,
        {
          function: "switchReadonly",
          data: {}
        });

      expect(interaction.state.readonly).toEqual(!prevReadonlyState);
    });

    describe("when contract in readonly", () => {
      const nonAdminCaller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111";

      beforeEach(async () => {
        await testEnv.interact<ProvidersRegistryInput>(
          "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
          providersContractId,
          {
            function: "switchReadonly",
            data: {}
          });
        expect(testEnv.readState(providersContractId).readonly).toBeTruthy();
      });

      it("should prevent from changing state by non-admins", async () => {
        await expect(testEnv.interact<ProvidersRegistryInput>(nonAdminCaller, providersContractId,
          {
            function: "registerProvider",
            data: {
              "provider": {
                "adminsPool": [],
                "profile": {
                  "name": "test-provider-1",
                  "description": "desc-1",
                  "url": "https://test-provider-1.ok"
                },
              }
            }
          })).rejects.toThrowError("Cannot call state modifying functions in readonly state.")
      });

      it("should prevent from changing  state by contract admins", async () => {
        await expect(testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
          {
            function: "registerProvider",
            data: {
              "provider": {
                "adminsPool": [],
                "profile": {
                  "name": "test-provider-1",
                  "description": "desc-1",
                  "url": "https://test-provider-1.ok"
                },
              }
            }
          })).rejects.toThrowError("Cannot call state modifying functions in readonly state.")
      });

      it("should should allow to change administrative state by admins", async () => {
        const prevTrace = testEnv.readState(providersContractId).trace;
        const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
          {
            function: "switchTrace",
            data: {}
          });
        expect(interaction.state.trace).toEqual(!prevTrace);
      });
    });
  });

  describe("updateAvailableTokens function", () => {
    let initialBalance = 2000;
    beforeEach(async () => {
      testEnv.deployContract(registryContractSrcPath, {
        contractAdmins: [caller]
      }, registryTxId);

      await testEnv.interact<ContractsRegistryInput>(caller, registryTxId,
        {
          function: "registerContracts",
          data: {
            contracts: {
              "providers-registry": providersContractId,
              "token": tokenContractTxId
            },
            comment: "initial deploy"
          }
        });

      await testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        });
    });

    it("should calculate tokens available for withdrawn from deposit (totalWithdrawn = 0)", async () => {
      // given
      testEnv.deployContract(tokenContractSrcPath, {
        ticker: "R_TEST",
        balances: {
          [caller]: initialBalance
        },
        contractDeposits: {
          "providers-registry": {
            deposit: 1000,
            withdraw: 0,
            wallets: {
              [caller]: {
                deposit: 1000,
                withdraw: 0,
                log: {
                  from: caller,
                  qty: 1000,
                  timestamp: 555
                }
              }
            }
          }
        }
      }, tokenContractTxId);

      // when
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        caller, providersContractId, {
        "function": "updateAvailableTokens",
        data: {
          providerId: caller
        }
      });

      // then
      expect(interaction.state.availableTokens).toEqual(
        { 'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY': 500 }
      );
    });

    it("should calculate tokens available for withdrawn from deposit (totalWithdrawn > 0)", async () => {
      testEnv.deployContract(tokenContractSrcPath, {
        ticker: "R_TEST",
        balances: {
          [caller]: initialBalance
        },
        contractDeposits: {
          "providers-registry": {
            deposit: 1000,
            withdraw: 200,
            wallets: {
              [caller]: {
                deposit: 1000,
                withdraw: 200,
                log: {
                  from: caller,
                  qty: 1000,
                  timestamp: 555
                }
              }
            }
          }
        }
      }, tokenContractTxId);

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        caller, providersContractId, {
        "function": "updateAvailableTokens",
        data: {
          providerId: caller
        }
      });

      expect(interaction.state.availableTokens).toEqual(
        { 'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY': 400 }
      );
    });
  });

  describe("providerAdmins function", () => {
    let providerId;

    beforeEach(async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": ['admin_1', 'admin_2'],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok",
              },
              "manifests": [{
                "changeMessage": "initial",
                "lockedHours": 5,
                "manifestTxId": "mft-tx-5"
              }],
            }
          }
        });

      providerId = Object.keys(interaction.state.providers)[0];
      
    });

    it("returns all admins", async () => {
      // given
      await deployContractsRegistry();

      // when
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        providersContractId,
        {
          function: "providerAdmins",
          data: {
            providerId: providerId
          }
        });

      // then
      expect(interaction.result).toEqual(
        {
          "admins": ["admin_1", "admin_2", providerId]
        }
      )
    });
  });
});
