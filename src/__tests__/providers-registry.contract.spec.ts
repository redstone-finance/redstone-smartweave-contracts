import ContractsTestingEnv from "../tools/ContractsTestingEnv";
import {ProvidersRegistryInput} from "../providers-registry/types";

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";

const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"
const initialState = `{
  "trace": false,
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

  describe("register-provider function", () => {
    it("registers new provider without manifest", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, contractId,
        {
          function: "register-provider",
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
        }, {
          height: 1000
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
          function: "register-provider",
          data: data
        }, {
          height: 1000
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
          function: "register-provider",
          data: data
        }, {
          height: 1000
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
          function: "register-provider",
          data: data
        }, {
          height: 1000
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
          function: "register-provider",
          data: data
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Provider profile url not defined.")
    });

    it("throws if initial locked tokens > 0", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
        {
          function: "register-provider",
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
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Initial stake must be zero.")
    });

    it("throws if trying to add manifest with provider", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(caller, contractId,
        {
          function: "register-provider",
          data: {
            "provider": {
              "adminsPool": [],
              "profile": {
                "name": "test-provider-1",
                "description": "desc-1",
                "url": "https://test-provider-1.ok"
              },
              "manifests": []
            }
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Manifest should be added add with separate add-provider-manifest function.")
    });
  });

  describe("remove-provider function", () => {
    // adding two providers before execution of each test
    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "register-provider",
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
        }, {
          height: 1000
        });

      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        contractId,
        {
          function: "register-provider",
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
        }, {
          height: 1000
        });
    });

    it("removes provider with given provider id", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        contractId,
        {
          function: "remove-provider",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222"
          }
        }, {
          height: 1000
        });

      expect(interaction.state.providers).toEqual(
        {
          "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
            "adminsPool": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"],
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
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        contractId,
        {
          function: "remove-provider",
          data
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("'providerId' field is required.")
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        contractId,
        {
          function: "remove-provider",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.")
    });

    it("throws if caller has no privileges to provider ", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222221",
        contractId,
        {
          function: "remove-provider",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222"
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222221 is not an admin for bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222")
    });
  });

  describe("add-provider-manifest function", () => {
    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "register-provider",
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
        }, {
          height: 1000
        });
    });

    it("adds manifest to a provider", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "add-provider-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            manifestData: {
              changeMessage: "initial add",
              lockedHours: 6,
              manifest: {
                "interval": 15000,
                "priceAggregator": "median",
                "defaultSource": ["yahoo-finance"],
                "sourceTimeout": 50000,
                "maxPriceDeviationPercent": 25,
                "tokens": {
                  "TSLA": {},
                }
              }
            }
          }
        }, {
          height: 1000
        });

      expect(interaction.state.providers["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"].manifests).toEqual(
        [{
          "uploadBlockHeight": 1000,
          "manifest": {
            "interval": 15000,
            "priceAggregator": "median",
            "defaultSource": ["yahoo-finance"],
            "sourceTimeout": 50000,
            "maxPriceDeviationPercent": 25,
            "tokens": {"TSLA": {}}
          },
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
          function: "add-provider-manifest",
          data
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("'providerId' field is required.");
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "add-provider-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.");
    });

    it("throws if caller has no privileges to provider", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112",
        contractId,
        {
          function: "add-provider-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112 is not an admin for bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111");
    });

    it("throws if manifest data is not set", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "add-provider-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }, {
          height: 1000
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
          function: "add-provider-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            manifestData: manifestData
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Manifest not set.");
    });

    it("throws if change message not set", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "add-provider-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            manifestData: {
              manifest: {},
              changeMessage: ""
            }
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Change message is not set.");
    });

  });

  describe("add-provider-admin function", () => {
    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "register-provider",
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
        }, {
          height: 1000
        });
    });

    it("throws if providerId not set", async () => {

      const data = JSON.parse(`{}`);

      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        contractId,
        {
          function: "add-provider-admin",
          data
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("'providerId' field is required.");
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "add-provider-admin",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.");
    });

    it("throws if caller has no privileges to provider", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112",
        contractId,
        {
          function: "add-provider-admin",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111112 is not an admin for bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111");
    });

    it("adds new admins for provider", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "add-provider-admin",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
            admins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333", "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_444444"]
          }
        }, {
          height: 1000
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

  describe("active-manifest function", () => {

    it("gets latest active manifest (1)", async () => {
      testEnv.pushState(
        contractId,
        {
          trace: true,
          providers: {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              manifests:
                [
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 12,
                    manifest: {
                      id: "700_12"
                    }
                  },
                ]
            }
          }
        });

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "active-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }, {
          height: 1000
        });

      expect(interaction.result).toEqual({
        "manifest": {
          "uploadBlockHeight": 700,
          "lockedHours": 12,
          "manifest": {"id": "700_12"}
        }
      });
    });

    it("gets latest active manifest (2)", async () => {
      testEnv.pushState(
        contractId,
        {
          trace: true,
          providers: {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              manifests:
                [
                  {
                    uploadBlockHeight: 500,
                    lockedHours: 12,
                    manifest: {
                      id: "500_12"
                    }
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 12,
                    manifest: {
                      id: "700_12"
                    }
                  },
                ]
            }
          }
        });

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "active-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }, {
          height: 1000
        });

      expect(interaction.result).toEqual({
        "manifest": {
          "uploadBlockHeight": 500,
          "lockedHours": 12,
          "manifest": {"id": "500_12"}
        }
      });
    });

    it("gets latest active manifest (3)", async () => {
      testEnv.pushState(
        contractId,
        {
          trace: true,
          providers: {
            "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111": {
              manifests:
                [
                  {
                    uploadBlockHeight: 500,
                    lockedHours: 12,
                    manifest: {
                      id: "500_12"
                    }
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 6,
                    manifest: {
                      id: "700_6"
                    }
                  },
                  {
                    uploadBlockHeight: 700,
                    lockedHours: 12,
                    manifest: {
                      id: "700_12"
                    }
                  },
                ]
            }
          }
        });

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "active-manifest",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"
          }
        }, {
          height: 1000
        });

      expect(interaction.result).toEqual({
        "manifest": {
          "uploadBlockHeight": 700,
          "lockedHours": 6,
          "manifest": {"id": "700_6"}
        }
      });
    });


  });

  describe("provider-data function", () => {

    beforeEach(async () => {
      await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "register-provider",
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
        }, {
          height: 1000
        });
    });

    it("throws if providerId not set", async () => {

      const data = JSON.parse(`{}`);

      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_222222",
        contractId,
        {
          function: "provider-data",
          data
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("'providerId' field is required.");
    });

    it("throws if provider does not exist", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "provider-data",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"
          }
        }, {
          height: 1000
        }))
        .rejects
        .toThrowError("Provider with id bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333 is not registered.");
    });

    it("gets provider by provider id", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
        contractId,
        {
          function: "provider-data",
          data: {
            providerId: "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111",
          }
        }, {
          height: 1000
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
            "manifests": [],
            "registerHeight": 1000
          }
        }
      )
    });
  });

  describe("add-contract-admins function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        contractId,
        {
          function: "add-contract-admins",
          data: {
            admins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111"]
          }
        }, {
          height: 1000
        })).rejects.toThrowError("Only admin is allowed to call this function");
    });

    it("should add new contract admins", async () => {
      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        contractId,
        {
          function: "add-contract-admins",
          data: {
            admins: ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111", "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333"]
          }
        }, {
          height: 1000
        });

      expect(interaction.state.contractAdmins).toEqual([
        'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY',
        'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111',
        'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_333333'
      ]);
    });
  });

  describe("switch-trace function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        contractId,
        {
          function: "switch-trace",
          data: {}
        }, {
          height: 1000
        })).rejects.toThrowError("Only admin is allowed to call this function");
    });

    it("should switch trace state", async () => {
      const prevTraceState = testEnv.readContract(contractId).trace

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        contractId,
        {
          function: "switch-trace",
          data: {}
        }, {
          height: 1000
        });

      expect(interaction.state.trace).toEqual(!prevTraceState);
    });
  });

});
