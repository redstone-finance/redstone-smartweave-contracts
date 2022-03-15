import {ActionSchema, ContractStatus, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {ContractError, Transaction} from "../imports";

export function registerContracts(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const contractsToRegister = action.registerContracts!!;

  if (!state.networks.has(contractsToRegister.networkId)) {
    throw new Error("[CE:NNF] Network not found");
  }

  const network = state.networks.get(contractsToRegister.networkId);
  /*
  OMG no closures support...and no for...of...
  const alreadyRegistered = registerContracts.contracts.filter(c => {
    return network.contracts.some(nc => {
      return nc.arweaveTxId == c;
    });
  });*/
  for (let i = 0; i < contractsToRegister.contracts.length; i++) {
    let contract = contractsToRegister.contracts[i];
    for (let j = 0; j < network.contracts.length; j++) {
      const registeredContract = network.contracts[j];
      if (registeredContract.arweaveTxId == contract) {
        throw new ContractError("[CE:CAR] Contracts already registered");
      }
    }
  }

  for (let i = 0; i < contractsToRegister.contracts.length; i++) {
    let contract = contractsToRegister.contracts[i];
    network.contracts.push({
      arweaveTxId: contract,
      status: ContractStatus.REGISTERED,
      totalGasUsed: 0,
      validatedHash: "",
      validatedHeight: 0,
      registeredBy: Transaction.owner(),
    });
  }

  return {
    state,
    result: null
  };
}
