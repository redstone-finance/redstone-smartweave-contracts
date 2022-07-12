import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {console} from "../imports";

export function connectNode(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const connectNode = action.connectNode;

  console.log(`Connecting node ${connectNode.nodeId}`);

  // TODO: add validation. lots of validation
  if (!state.networks.has(connectNode.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }
  const network = state.networks.get(connectNode.networkId);
  if (network.connectedNodes.has(connectNode.nodeId)) {
    throw new Error("[CE:NAC] Node already connected");
  }

  const nodesKeys: string[] = network.connectedNodes.keys();
  const nodesToRemove: string[] = [];

  // in case of docker restarts - a new node with same address might be registered
  // - node id comes in this case from the docker container id.
  for (let i = 0; i < nodesKeys.length; i++) {
    let nodeKey: string = nodesKeys[i];
    if (network.connectedNodes.get(nodeKey).address == connectNode.address) {
      nodesToRemove.push(nodeKey);
    }
  }

  for (let i = 0; i < nodesToRemove.length; i++) {
    network.connectedNodes.delete(nodesToRemove[i])
  }

  network.connectedNodes.set(connectNode.nodeId, connectNode);

  return {
    state,
    result: null
  };
}
