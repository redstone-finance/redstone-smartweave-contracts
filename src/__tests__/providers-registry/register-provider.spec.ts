import ContractsTestingEnv from '../../tools/ContractsTestingEnv';
import { ProvidersRegistryInput } from '../../providers-registry/types';

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";

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


});
