import {ContractHandlerResult, ContractInteraction} from "smartweave/lib/contract-step";
import {SmartWeaveGlobal} from "smartweave/lib/smartweave-global";

declare const ContractError: any;

export function handle(state: any, action: ContractInteraction): ContractHandlerResult {
  // just to verify in test whether caller is set properly.
  if (action.caller === "wrong-caller") {
    throw new ContractError("wrong caller");
  }
  if (state.text === undefined) {
    state.text = "";
  }
  if (action.input.function === "add") {
    state.text += " value";
    return {state};
  }
  if (action.input.function === "value") {
    return {result:state.text}
  }
}
