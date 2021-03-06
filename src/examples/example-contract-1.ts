import {ContractHandlerResult, ContractInteraction} from "smartweave/lib/contract-step";
import {SmartWeaveGlobal} from "smartweave/lib/smartweave-global";

declare const SmartWeave: SmartWeaveGlobal;

export function handle(state: any, action: ContractInteraction): ContractHandlerResult {
  if (state.counter === undefined) {
    state.counter = 0;
  }
  if (action.input.function === "add") {
    state.counter++;
    return {state};
  }
  if (action.input.function === "value") {
    return {result: state.counter}
  }
  if (action.input.function === "blockHeight") {
    return {result: SmartWeave.block.height};
  }
  if (action.input.function === "readContract2") {
    const id = action.input.contractId;
    const value = SmartWeave.contracts.readContractState(id);
    return {result: value};
  }
}
