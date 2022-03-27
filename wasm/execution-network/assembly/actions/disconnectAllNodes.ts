import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {ContractError, Transaction, console} from "../imports";

export function disconnectAllNodes(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const caller = Transaction.owner();
  const disconnectNode = action.disconnectAllNodes!!;

  if (!state.networks.has(disconnectNode.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }

  const network = state.networks.get(disconnectNode.networkId);
  if (network.owner != caller) {
    throw new ContractError("[CE:NAD] Transaction caller not allowed to disconnect node");
  }
  network.connectedNodes = new Map();

  return {
    state,
    result: null
  };
}
