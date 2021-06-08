export interface BeaconState {
  contractAdmins: string[]

  // map from contract name (eg. "providers-registry") to an array
  // of contract ids (ie. Arweave transaction ids) deployed on Arweave blockchain. Last element is the most recent version.
  contracts: {
    [name: string]: string[];
  }
}

export interface BeaconInput {
  function: BeaconGetFunction | BeaconSetFunction;
  data: BeaconContractCurrentTxIdData | BeaconRegisterContractData
}

export interface BeaconContractCurrentTxIdData {
  contractName: string;
}

export interface BeaconRegisterContractData {
  contractName: string;
  contractTxId: string;
}

export interface BeaconAction {
  input: BeaconInput;
  caller: string;
}

export interface BeaconResult {
  contractTxId: string;
}

export type BeaconGetFunction = 'contract-current-tx-id';
export type BeaconSetFunction = 'register-contract' | 'add-contract-version'
