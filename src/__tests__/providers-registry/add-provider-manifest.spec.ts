import ContractsTestingEnv from '../../tools/ContractsTestingEnv';
import { ProvidersRegistryInput } from '../../providers-registry/types';

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";
const initialState = `{
  "trace": false,
  "readonly": false,
  "contractAdmins": ["bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"]
}`;

describe('Provider Registry Contract', () => {
  const testEnv = new ContractsTestingEnv();
  let providersContractId: string;

  beforeEach(() => {
    providersContractId = testEnv.deployContract(contractSrcPath, JSON.parse(initialState));
  });

  afterEach(() => {
    testEnv.clearContracts();
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


});
