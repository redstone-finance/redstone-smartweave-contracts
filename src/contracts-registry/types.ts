export interface ContractsRegistryState {
  contractAdmins: [];

  versions: {
    // A map from version (eg. 'v1', 'v2') to contracts used in this version.
    // Each breaking-change in contract code requires adding new version.
    [version: string]: VersionData
  }
}

export interface ContractsRegistryInput {
  function: ContractsRegistryGetFunction | ContractsRegistrySetFunction;
  data: ContractsRegistryCurrentTxIdData | ContractsRegistryRegisterContractsData
}

export interface VersionData {
  comment?: string,
  deployedBlockHeight: number;
  // A map from a contract name (eg. 'providers-registry', 'disputes') to an array of transaction ids of
  // this contract deployed on Arweave (within given version). Last element in array is the most recent
  // contract deployed.
  contracts: {
    [name: string]: string[];
  }
}

export interface ContractsRegistryCurrentTxIdData {
  contractNames: string[];
  version?: string;
}

export interface ContractsRegistryRegisterContractsData {
  contracts: {
    [name: string]: string;
  }
  version?: string;
  comment?: string;
}

export interface ContractsRegistryAction {
  input: ContractsRegistryInput;
  caller: string;
}

export interface ContractsRegistryResult {
  [name: string]: string
}

export type ContractsRegistryGetFunction = 'contractsCurrentTxId';
export type ContractsRegistrySetFunction = 'registerContracts';
