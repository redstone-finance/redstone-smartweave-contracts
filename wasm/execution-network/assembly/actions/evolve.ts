import {ActionSchema, StateSchema} from "../schemas";
import {Transaction} from "../imports/smartweave/transaction";
import {ContractResultSchema} from "../contract";
import {Contract, ContractError} from "../imports";

export function evolve(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const evolve = action.evolve!!;
  const contractOwner = Contract.owner();
  const sender = Transaction.owner();

  if (sender != contractOwner) {
    throw ContractError("EPE", "Evolve permissions error - only contract owner can evolve");
  }

  if (!state.canEvolve) {
    throw ContractError("ECE", "Evolve not allowed");
  }

  // TODO: validate evolve txid format
  state.evolve = evolve;

  return {
    state,
    result: null
  };
}
