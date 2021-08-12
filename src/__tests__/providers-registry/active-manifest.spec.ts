import ContractsTestingEnv from '../../tools/ContractsTestingEnv';
import { ProvidersRegistryInput } from '../../providers-registry/types';

const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"
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

  })
});
