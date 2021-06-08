import
{
  BeaconAction, BeaconContractCurrentTxIdData, BeaconRegisterContractData,
  BeaconResult,
  BeaconState
} from "./types";
import {SmartWeaveGlobal} from "smartweave/lib/smartweave-global";

declare type ContractResult = { state: BeaconState } | { result: BeaconResult }
declare const ContractError: any;
declare const SmartWeave: SmartWeaveGlobal;

export function handle(state: BeaconState, action: BeaconAction): ContractResult {
  const input = action.input;

  if (action.input.function === "register-contract") {
    if (state.contracts === undefined) {
      state.contracts = {};
    }

    const data = input.data as BeaconRegisterContractData;
    const contractName = data.contractName;
    const contractId = data.contractTxId;
    const caller = action.caller;

    if (!state.contractAdmins.includes(caller)) {
      throw new ContractError("No privileges to register new contract.");
    }
    if (state.contracts[contractName] !== undefined) {
      throw new ContractError(`Contract with name '${contractName}' already registered.`);
    }
    if (contractName === undefined || contractName.length === 0) {
      throw new ContractError("Contract name not defined.");
    }
    if (contractId === undefined || contractId.length === 0) {
      throw new ContractError("Contract transaction id not defined.")
    }

    state.contracts[contractName] = [contractId];

    return {state}
  }

  if (action.input.function === "add-contract-version") {
    const data = input.data as BeaconRegisterContractData;
    const contractName = data.contractName;
    const contractId = data.contractTxId;
    const caller = action.caller;

    if (!state.contractAdmins.includes(caller)) {
      throw new ContractError("No privileges to register new contract.");
    }
    if (contractName === undefined || contractName.length === 0) {
      throw new ContractError("Contract name not defined.");
    }
    if (state.contracts[contractName] === undefined) {
      throw new ContractError(`Contract with name '${contractName}' not registered.`);
    }
    if (contractId === undefined || contractId.length === 0) {
      throw new ContractError("Contract transaction id not defined.")
    }

    state.contracts[contractName].push(contractId);

    return {state}
  }

  if (action.input.function === "contract-current-tx-id") {
    const data = input.data as BeaconContractCurrentTxIdData;
    const contractName = data.contractName;
    if (contractName === undefined || contractName.length === 0) {
      throw new ContractError("Contract name not defined.");
    }
    if (state.contracts[contractName] === undefined) {
      throw new ContractError(`Contract with name '${contractName}' not registered.`);
    }

    return {result: {contractTxId: currentContractTxId(contractName)}}
  }

  function currentContractTxId(contractName: string) {
    const contractsLength = state.contracts[contractName].length;
    return state.contracts[contractName][contractsLength - 1];
  }

  throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
}
