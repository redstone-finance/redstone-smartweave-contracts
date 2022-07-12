import {ActionSchema, ContractStatus, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {Transaction} from "../imports";

export function registerContractGroups(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const contractGroupsToRegister = action.registerContractsGroup;

  if (!state.networks.has(contractGroupsToRegister.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }

  const network = state.networks.get(contractGroupsToRegister.networkId);
  for (let i = 0; i < contractGroupsToRegister.groups.length; i++) {
    let contractGroup = contractGroupsToRegister.groups[i];
    for (let j = 0; j < network.contractGroups.length; j++) {
      const registeredContractGroup = network.contractGroups[j];
      if (registeredContractGroup == contractGroup) {
        throw new Error(`[CE:CGAR] Contract group ${contractGroup} already registered`);
      }
    }
  }

  for (let i = 0; i < contractGroupsToRegister.groups.length; i++) {
    let contractGroup = contractGroupsToRegister.groups[i];
    network.contractGroups.push(contractGroup);
  }

  return {
    state,
    result: null
  };
}
