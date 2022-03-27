import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {ContractError, Transaction, console} from "../imports";

export function disconnectNode(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const caller = Transaction.owner();
  const disconnectNode = action.disconnectNode!!;

  if (!state.networks.has(disconnectNode.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }

  const network = state.networks.get(disconnectNode.networkId);
  if (!network.connectedNodes.has(disconnectNode.id)) {
    throw new Error("[CE:NAC] Node already disconnected");
  }
  const node = network.connectedNodes.get(disconnectNode.id);

  // note: only node owner or network owner are allowed to disconnect the node from network.
  if (node.owner != caller && network.owner != caller) {
    throw new ContractError("[CE:NAD] Transaction caller not allowed to disconnect node");
  }
  network.connectedNodes.delete(disconnectNode.id);

  return {
    state,
    result: null
  };
}
