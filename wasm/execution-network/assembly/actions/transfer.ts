import {ActionSchema, StateSchema} from "../schemas";
import {Transaction} from "../imports/smartweave/transaction";
import {ContractResultSchema} from "../contract";
import {ContractError} from "../imports";

export function transfer(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const transferData = action.transfer!!;
  const target = transferData.target;
  const qty = transferData.qty;
  const caller = Transaction.owner();

  if (qty <= 0 || caller === target) {
    throw ContractError("ITT", "Invalid token transfer");
  }

  if (!state.balances.has(caller) || state.balances.get(caller) < qty) {
    throw ContractError("NEB", `Caller balance not high enough to send ${qty} token(s)!`);
  }

  // Lower the token balance of the caller
  state.balances.set(caller, state.balances.get(caller) - qty);
  if (!state.balances.has(target)) {
    state.balances.set(target, qty);
  } else {
    state.balances.set(target, state.balances.get(target) + qty);
  }

  return {
    state,
    result: null
  };
}
