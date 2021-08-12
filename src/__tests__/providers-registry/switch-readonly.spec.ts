import ContractsTestingEnv from '../../tools/ContractsTestingEnv';
import { ProvidersRegistryInput } from '../../providers-registry/types';

const contractSrcPath = "./src/providers-registry/providers-registry.contract.ts";
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

  describe("switchReadonly function", () => {

    it("should throw if caller is not an admin", async () => {
      await expect(testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBZ",
        providersContractId,
        {
          function: "switchReadonly",
          data: {}
        })).rejects.toThrowError("Administrative functions can be called only by contract admins.");
    });

    it("should switch readonly state", async () => {
      const prevReadonlyState = testEnv.readState(providersContractId).readonly

      const interaction = await testEnv.interact<ProvidersRegistryInput>(
        "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
        providersContractId,
        {
          function: "switchReadonly",
          data: {}
        });

      expect(interaction.state.readonly).toEqual(!prevReadonlyState);
    });

    describe("when contract in readonly", () => {
      const nonAdminCaller = "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_111111";

      beforeEach(async () => {
        await testEnv.interact<ProvidersRegistryInput>(
          "bYz5YKzHH97983nS8UWtqjrlhBHekyy-kvHt_eBxBBY",
          providersContractId,
          {
            function: "switchReadonly",
            data: {}
          });
        expect(testEnv.readState(providersContractId).readonly).toBeTruthy();
      });

      it("should prevent from changing state by non-admins", async () => {
        await expect(testEnv.interact<ProvidersRegistryInput>(nonAdminCaller, providersContractId,
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
          })).rejects.toThrowError("Cannot call state modifying functions in readonly state.")
      });

      it("should prevent from changing  state by contract admins", async () => {
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
          })).rejects.toThrowError("Cannot call state modifying functions in readonly state.")
      });

      it("should should allow to change administrative state by admins", async () => {
        const prevTrace = testEnv.readState(providersContractId).trace;
        const interaction = await testEnv.interact<ProvidersRegistryInput>(caller, providersContractId,
          {
            function: "switchTrace",
            data: {}
          });
        expect(interaction.state.trace).toEqual(!prevTrace);
      });
    });
  });

});
