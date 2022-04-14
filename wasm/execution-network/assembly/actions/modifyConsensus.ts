import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {ContractError, Transaction, console} from "../imports";

export function modifyConsensus(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const caller = Transaction.owner();
  const modifyConsensus = action.modifyConsensus;

  if (!state.networks.has(modifyConsensus.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }

  const network = state.networks.get(modifyConsensus.networkId);
  if (network.owner != caller) {
    throw new ContractError("[CE:NAD] Transaction caller not allowed to modify consensus params");
  }

  network.consensusParams = modifyConsensus.params;

  return {
    state,
    result: null
  };
}
