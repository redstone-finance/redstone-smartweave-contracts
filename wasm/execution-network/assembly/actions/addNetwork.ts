import {ActionSchema, StateSchema} from "../schemas";
import {Transaction} from "../imports/smartweave/transaction";
import {ContractResultSchema} from "../contract";
import {ContractError} from "../imports";

export function addNetwork(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const addNetworkData = action.addNetwork!!;
  const networkOwner = Transaction.owner();

  if (addNetworkData.id == null || addNetworkData.id.length == 0) {
    throw ContractError("NID", "Network id not specified");
  }

  if (state.networks.has(addNetworkData.id)) {
    throw ContractError("NR", "Network already registered");
  }

  if (addNetworkData.name == null || addNetworkData.name.length == 0) {
    throw ContractError("NNS", "Network name not specified");
  }

  if (addNetworkData.url == null || addNetworkData.url.length == 0) {
    throw ContractError("NUS", "Network url not specified");
  }
  // TODO: add more validation

  state.networks.set(addNetworkData.id, {
    id: addNetworkData.id,
    contracts: [],
    desc: addNetworkData.desc,
    owner: networkOwner,
    name: addNetworkData.name,
    stakedTokens: 0,
    url: addNetworkData.url,
    consensusParams: {
      quorumSize: 6, //in fact - 0.6
      sampleSize: 4,
      decisionThreshold: 1,
    }
  });

  return {
    state,
    result: null
  };
}
