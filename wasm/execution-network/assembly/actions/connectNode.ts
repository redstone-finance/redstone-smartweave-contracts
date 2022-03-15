import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {console} from "../imports";

export function connectNode(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const connectNode = action.connectNode!!;

  console.log(`Connecting node ${connectNode.nodeId}`);

  // TODO: add validation. lots of validation
  if (!state.networks.has(connectNode.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }
  const network = state.networks.get(connectNode.networkId);
  if (network.connectedNodes.has(connectNode.nodeId)) {
    throw new Error("[CE:NAC] Node already connected");
  }
  network.connectedNodes.set(connectNode.nodeId, connectNode);

  return {
    state,
    result: null
  };
}
