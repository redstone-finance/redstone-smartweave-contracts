import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";

export function unregisterContracts(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const contractsToUnregister = action.unregisterContracts;

  if (!state.networks.has(contractsToUnregister.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }

  const network = state.networks.get(contractsToUnregister.networkId);
  const indexesToRemove: i32[] = [];

  for (let i = 0; i < contractsToUnregister.contracts.length; i++) {
    let contractToUnregister = contractsToUnregister.contracts[i];

    for (let j = 0; j < network.contracts.length; j++) {
      const registeredContract = network.contracts[j];
      if (registeredContract.arweaveTxId == contractToUnregister) {
        indexesToRemove.push(j);
        break;
      }
    }
  }

  indexesToRemove.sort(function (a, b) {
    return b - a;
  });

  for (let i = indexesToRemove.length - 1; i >= 0; i--) {
    network.contracts.splice(indexesToRemove[i], 1);
  }

  return {
    state,
    result: null
  };
}
