import ContractsTestingEnv from "../tools/ContractsTestingEnv";
import {ProvidersRegistryInput} from "../providers-registry/types";

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";

const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"
const initialState = `{
  "trace": false,
  "readonly": false,
  "contractAdmins": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"]
}`

describe("Provider Registry Contract", () => {

  const testEnv = new ContractsTestingEnv();
  let contractId: string

  beforeEach(() => {
    contractId = testEnv.deployContract(contractSrcPath, JSON.parse(initialState));
  });

  afterEach(() => {
    testEnv.clearContracts();
  });

  describe("registerProvider function", () => {
    it("registers new provider without manifest", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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
      const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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
      await testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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
      await testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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

      await expect(testEnv.interact<ProvidersRegistryInput>("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111", contractId,
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

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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

      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
        {
          function: "registerProvider",
          data: data
        }))
        .rejects
        .toThrowError("Provider profile url not defined.")
    });

    it("throws if initial locked tokens > 0", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
        {
          function: "registerProvider",
          data: {
            "provider": {
              "adminsPool": [],
              "lockedTokens": 444,
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
            }
          }
        }))
        .rejects
        .toThrowError("Initial stake must be zero.")
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
        contractId,
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
      testEnv.contractEnv(contractId).swGlobal.unsafeClient.transactions.getData = jest.fn().mockImplementation((contractId, options) => {
        console.log("aaaa", contractId)
        if (contractId == "700_6") {
          return `{"foo": "bar"}`;
        }
      });

      testEnv.pushState(
        contractId,
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
        contractId,
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
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
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
        contractId,
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
        contractId,
        {
          function: "providerData",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.");
    });

    it("gets provider by provider id", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "providerData",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
          }
        });

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
            "registerHeight": 1000
          }
        }
      )
    });
  });

  describe("providersData function", () => {

    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
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
        contractId,
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
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "providersData",
          data: {}
        });

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
              "registerHeight": 1000
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
              "registerHeight": 1000
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
        contractId,
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
        contractId,
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
        contractId,
        {
          function: "switchTrace",
          data: {}
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("should switch trace state", async () => {
      const prevTraceState = testEnv.readContract(contractId).trace

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        contractId,
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
        contractId,
        {
          function: "switchReadonly",
          data: {}
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("should switch readonly state", async () => {
      const prevReadonlyState = testEnv.readContract(contractId).readonly

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        contractId,
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
          contractId,
          {
            function: "switchReadonly",
            data: {}
          });
        expect(testEnv.readContract(contractId).readonly).toBeTruthy();
      });

      it("should prevent from changing state by non-admins", async () => {
        await expect(testEnv.interact<ProvidersRegistryInput>(nonAdminCaller, contractId,
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
        await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
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
        const prevTrace = testEnv.readContract(contractId).trace;
        const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, contractId,
          {
            function: "switchTrace",
            data: {}
          });
        expect(interaction.state.trace).toEqual(!prevTrace);
      });
    });
  });

});
