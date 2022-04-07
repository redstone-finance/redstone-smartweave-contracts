import {ActionSchema, StateSchema} from "../schemas";
import {ContractResultSchema} from "../contract";

export function balance(state: StateSchema, action: ActionSchema): ContractResultSchema {
  const target = action.target;

  if (!target) {
    throw new Error("[CE:NOB] Must specify target to get balance for");
  }

  if (!state.balances.has(target)) {
    throw new Error("[CE:TNE] Cannot get balance, target does not exist");
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
