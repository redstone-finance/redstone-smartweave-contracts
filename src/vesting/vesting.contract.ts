import {ProvidersRegistryResult, ProvidersRegistryState} from "../providers-registry/types";

declare type ContractResult = { state: any } | { result: any }
declare const ContractError;
declare const SmartWeave;


const exampleState = {

  vests: {
    "walletId": {
      locked: 1000, //how many tokens are locked in total
      vested: 0, //how many tokens vested until  "now"
      released: 0, //how many tokens we already transferred to wallet balance.
      // this one should be stored by token.contract?
    }
  }
}

const startDate = Date.now();

export function handle(state:any , action: any): ContractResult {
  const input = action.input;
  const caller = action.caller;

  // this "manually" vesting is only for testing purposes...
  if (input.function === "vest") {
    const amount = input.qty;
    const vests = state.vests[caller];
    const vestAmount = Math.min(vests.locked, amount);

    vests.locked -= vestAmount;
    vests.vested += vestAmount;

    return {state};
  }

  if (input.function === "update") {
    // update contract's state to get current info about already unlocked tokens - before calling token.contract.withdraw().
  }

  throw new ContractError("unknown function");
}
