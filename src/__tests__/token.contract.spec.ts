import ContractsTestingEnv, {Contract} from "../tools/ContractsTestingEnv";
import {registryTxId} from "../common/ContractInteractions";

describe("Token Contract", () => {

  const caller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY"

  const providersContract: Contract = {
    src: "./src/providers-registry/providers-registry.contract.ts",
    txId: "providersContractTxId",
    initialState: {
      "trace": true,
      "readonly": false,
      "contractAdmins": [caller],
      "providers": {
        [caller]: {
          "adminsPool": [caller],
          "profile": {
            "name": "Test",
            "description": "test",
            "url": "test",
            "id": "testId"
          },
          "manifests": [
            {
              "changeMessage": "initial manifest",
              "lockedHours": 0,
              "manifestTxId": "mTxId"
            }
          ],
          "registerHeight": 706749
        },
      }
    }
  }

  const tokenContract: Contract = {
    src: "./src/token/token.contract.ts",
    txId: "tokenContractTxId",
    initialState: {
      "ticker": "R_TEST",
      "balances": {
        [caller]: 1000
      }
    }
  }

  const registryContract: Contract = {
    src: "./src/contracts-registry/contracts-registry.contract.ts",
    txId: registryTxId,
    initialState: {
      contractAdmins: [caller],
      versions: {
        "v1": {
          comment: "initial deploy",
          deployedBlockHeight: 706747,
          contracts: {
            "providers-registry": [providersContract.txId],
            "token": [tokenContract.txId]
          }
        }
      }
    }
  }

  const testEnv = new ContractsTestingEnv();

  beforeEach(() => {
    testEnv.deploy(registryContract);
    testEnv.deploy(providersContract);
    testEnv.deploy(tokenContract);
  });

  afterEach(() => {
    testEnv.clearContracts();
  });

  describe("processStakeRequest function", () => {
    beforeEach(async () => {
      await testEnv.interact(
        caller,
        providersContract.txId,
        {
          function: "stake",
          data: {
            "providerId": caller,
            "qty": 100
          }
        })
    });

    it("should process stake requests", async () => {
      const interaction = await testEnv.interact(
        caller,
        tokenContract.txId,
        {
          function: "processStakeRequest"
        });

      expect(interaction.state.stakeUpdateRegistry).toEqual(
        {
          'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY': {
            _Y3CTqmF3v8Q38026aell4MgOgioPZ3XNnDjd17MgvY: {
              targetId: 'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY',
              qty: 100,
              caller: 'bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY',
              timestamp: 5555,
              type: 'provider',
              status: 'ok',
              description: 'Staked 100 tokens, balance after 900'
            }
          }
        });

      expect(interaction.state.balances[caller]).toEqual(900);
    });


  });

});
