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

  describe("switchTrace function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        providersContractId,
        {
          function: "switchTrace",
          data: {}
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("should switch trace state", async () => {
      const prevTraceState = testEnv.readState(providersContractId).trace

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        providersContractId,
        {
          function: "switchTrace",
          data: {}
        });

      expect(interaction.state.trace).toEqual(!prevTraceState);
    });
  });


});
