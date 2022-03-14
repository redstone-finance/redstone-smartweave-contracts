// common imports - do not remove (even if IDE reports as non-used)!
import {
  Block,
  console,
  Contract,
  ContractFn,
  HandlerResultSchema,
  SmartweaveSchema,
  parse,
  stringify,
  Transaction,
  ContractError
} from "./imports";

import {ActionSchema, ResultSchema, StateSchema} from "./schemas";
import {addNetwork} from "./actions/addNetwork";
import {removeNetwork} from "./actions/removeNetwork";
import {registerContracts} from "./actions/registerContracts";
import {acceptedContracts} from "./actions/acceptedContracts";
import {balance} from "./actions/balance";
import {transfer} from "./actions/transfer";
import {evolve} from "./actions/evolve";

export type ContractResultSchema = HandlerResultSchema<StateSchema, ResultSchema>;

const functions: Map<string, ContractFn<StateSchema, ActionSchema, ResultSchema>> = new Map();
functions.set("addNetwork", addNetwork); // network operator
functions.set("removeNetwork", removeNetwork); // network operator
functions.set("registerContracts", registerContracts); // contract developer
functions.set("acceptedContracts", acceptedContracts); // network nodes
functions.set("balance", balance);
functions.set("transfer", transfer);
functions.set("evolve", evolve); // contract owner 
/*functions.set("acceptContracts", acceptContracts); // network operator
functions.set("rejectContracts", rejectContracts); // network operator*/

let contractState: StateSchema;

@contract
function handle(state: StateSchema, action: ActionSchema): ResultSchema | null {
  console.log(`Function called: "${action.function}"`);

  const fn = action.function;
  if (functions.has(fn)) {
    const handlerResult = functions.get(fn)(state, action);
    if (handlerResult.state != null) {
      contractState = handlerResult.state!!;
    }
    return handlerResult.result;
  } else {
    throw ContractError("WTF", `Unknown function ${action.function}`);
  }
}
