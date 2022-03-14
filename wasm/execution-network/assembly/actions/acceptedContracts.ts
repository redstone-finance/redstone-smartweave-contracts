import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {ContractError} from "../imports";

export function acceptedContracts(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const networkId = action.acceptedContracts!!.networkId;

  if (!state.networks.has(networkId)) {
    throw ContractError("NNF", "Network not found");
  }

  // TODO: return only contracts accepted by network owner
  const acceptedContracts = state.networks.get(networkId).contracts.map<string>((c) => {
    return c.arweaveTxId;
  });

  return {
    state: null,
    result: {
      acceptedContracts
    }
  };
}
