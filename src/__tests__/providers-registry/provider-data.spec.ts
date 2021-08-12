import ContractsTestingEnv from '../../tools/ContractsTestingEnv';
import { ProvidersRegistryInput } from '../../providers-registry/types';
import { registryTxId } from '../../common/ContractInteractions';
import { ContractsRegistryInput } from '../../contracts-registry/types';

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";
const tokenContractSrcPath = "./src/token/token.contract.ts";
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


});
