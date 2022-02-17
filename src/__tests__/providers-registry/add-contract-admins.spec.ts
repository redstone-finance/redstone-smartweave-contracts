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

  describe("addContractAdmins function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        providersContractId,
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
        providersContractId,
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

});
