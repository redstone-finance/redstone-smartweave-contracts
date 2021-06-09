import {
  ContractsRegistryAction,
  ContractsRegistryCurrentTxIdData,
  ContractsRegistryRegisterContractsData,
  ContractsRegistryResult,
  ContractsRegistryState, VersionData
} from "./types";
import {Tools} from "../common/Tools";
import {ContractAdmin} from "../common/ContractAdmin";

declare type ContractResult = { state: ContractsRegistryState } | { result: ContractsRegistryResult }
declare const ContractError: any;
declare const SmartWeave: any;

export function handle(state: ContractsRegistryState, action: ContractsRegistryAction): ContractResult {
  const input = action.input;

  ContractAdmin.checkAndCreate(
    action.caller,
    input.function,
    state.contractAdmins,
    ["registerContracts"]);

  switch (input.function) {
    case "registerContracts":
      const registerContractsData = input.data as ContractsRegistryRegisterContractsData;
      Tools.initIfUndefined(state, "versions", {});
      const registerVersion = registerContractsData.version || getLatestVersion(state.versions);
      Tools.initIfUndefined(state.versions, registerVersion, {
        comment: registerContractsData.comment,
        deployedBlockHeight: SmartWeave.block.height,
        contracts: {}
      });

      const versionData: VersionData = state.versions[registerVersion];

      Object.keys(registerContractsData.contracts).forEach((contractName) => {
        Tools.initIfUndefined(versionData.contracts, contractName, []);
        versionData.contracts[contractName].push(registerContractsData.contracts[contractName]);
      });

      return {state};

    case "contractsCurrentTxId":
      const currentTxIdData = input.data as ContractsRegistryCurrentTxIdData;
      const version = currentTxIdData.version || getLatestVersion(state.versions);

      return {result: currentContractTxId(currentTxIdData.contractNames, version)};

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }

  function getLatestVersion(versions: { [version: string]: VersionData }): string {
    const versionsKeys: string[] = Object.keys(versions);
    if (versionsKeys.length === 0) {
      return "v1";
    } else {
      return "v" + versionsKeys
        .map((key) => {
          return +key.replace("v", "");
        })
        .sort()
        .slice()
        .pop();
    }
  }

  function currentContractTxId(contractNames: string[], version: string): { [contractName: string]: string } {
    return contractNames.reduce(function (acc, contractName, i) {
      acc[contractName] = state.versions[version]["contracts"][contractName].slice().pop();
      return acc;
    }, {});
  }

}
