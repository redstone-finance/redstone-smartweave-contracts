import {
  ContractsRegistryAction,
  ContractsRegistryCurrentTxIdData,
  ContractsRegistryRegisterContractsData,
  ContractsRegistryResult,
  ContractsRegistryState, VersionData
} from "./types";
import {Tools} from "../common/Tools";
import {ContractAdmin} from "../common/ContractAdmin";
import {Validators} from "../common/Validators";

declare type ContractResult = { state: ContractsRegistryState } | { result: ContractsRegistryResult }
declare const ContractError: any;
declare const SmartWeave: any;

const versionRegex = new RegExp('^v[1-9][0-9]*$', 'g');

export function handle(state: ContractsRegistryState, action: ContractsRegistryAction): ContractResult {
  const input = action.input;

  ContractAdmin.checkAndCreate(
    action.caller,
    input.function,
    state.contractAdmins,
    ["registerContracts"]);

  switch (input.function) {
    case "registerContracts": {
      const registerContractsData = input.data as ContractsRegistryRegisterContractsData;
      checkInputVersion(registerContractsData.version);
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
    }

    case "contractsCurrentTxId": {
      const currentTxIdData = input.data as ContractsRegistryCurrentTxIdData;
      //console.log(`contractsCurrentTxId`, JSON.stringify(state.versions));

      if (state.versions === undefined) {
        throw new ContractError("No version registered yet.");
      }
      const version = currentTxIdData.version || getLatestVersion(state.versions);
      if (!isVersionLike(version)) {
        throw new ContractError("")
      }

      return {result: currentContractTxId(currentTxIdData.contractNames, version)};
    }

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}".`);
  }

  function isVersionLike(version: string) {
    if (!Validators.isTypeOf(version, 'string')) {
      return false;
    }

    if (!versionRegex.test(version)) {
      return false;
    }

    return true;
  }

  function checkInputVersion(inputVersion) {
    if (inputVersion !== undefined && !isVersionLike(inputVersion)) {
      throw new ContractError("Wrong version format - should be 'v[number]'.");
    }
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
      const versionData = state.versions[version];
      if (versionData === undefined) {
        throw new ContractError(`No such version ${version}.`);
      }

      const contractVersionsData = versionData["contracts"][contractName];
      if (contractVersionsData === undefined) {
        throw new ContractError(`Contract ${contractName} is not defined for version ${version}.`);
      }

      acc[contractName] = contractVersionsData.slice().pop();
      return acc;
    }, {});
  }

}
