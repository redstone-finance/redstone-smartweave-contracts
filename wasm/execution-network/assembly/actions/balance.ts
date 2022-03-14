import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";
import {ContractError} from "../imports";

export function balance(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const target = action.target!!;

  if (!target) {
    throw ContractError("NOB", "Must specify target to get balance for");
  }

  if (!state.balances.has(target)) {
    throw ContractError("TNE", "Cannot get balance, target does not exist");
  }

  return {
    state: null,
    result: {
      balance: {
        balance: state.balances.get(target),
        target: target,
        ticker: state.ticker
      }
    }
  }
}
