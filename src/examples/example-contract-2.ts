import {ContractHandlerResult, ContractInteraction} from "smartweave/lib/contract-step";
import {SmartWeaveGlobal} from "smartweave/lib/smartweave-global";

declare const ContractError: any;
declare const SmartWeave: SmartWeaveGlobal;

export function handle(state: any, action: ContractInteraction): ContractHandlerResult {
  if (action.caller !== "test-caller") {
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