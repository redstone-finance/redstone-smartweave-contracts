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
        {'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY': 500}
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
        {'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY': 400}
      );
    });
  });

});
