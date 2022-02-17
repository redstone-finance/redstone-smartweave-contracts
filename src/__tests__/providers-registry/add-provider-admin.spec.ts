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

});
