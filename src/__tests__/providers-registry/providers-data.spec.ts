import ContractsTestingEnv from '../../tools/ContractsTestingEnv';
import { ProvidersRegistryInput } from '../../providers-registry/types';
import { registryTxId } from '../../common/ContractInteractions';
import { ContractsRegistryInput } from '../../contracts-registry/types';

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";
const tokenContractTxId = "tokenContractTxId";
const registryContractSrcPath = "./src/contracts-registry/contracts-registry.contract.ts";

const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"
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

});
