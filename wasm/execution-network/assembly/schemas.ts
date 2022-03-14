@serializable
export class StateSchema {
  owner: string;
  ticker: string
  name: string
  balances: Map<string, u32>
  // a map from network operator wallet address (jwkAddress) to network data
  networks: Map<String, Network>
  canEvolve: boolean
  evolve: string | null
}

@serializable
export class Network {
  id: string
  owner: string
  name: string
  desc: string
  url: string
  stakedTokens: u64
  contracts: Contract[]
  consensusParams: ConsensusParams
}

export enum ContractStatus {
  REGISTERED = 0,
  ACCEPTED = 1,
  REJECTED = 2
}

@serializable
export class Contract {
  arweaveTxId: string
  status: ContractStatus
  validatedHeight: u32
  validatedHash: string
  totalGasUsed: u64
  registeredBy: string
}

@serializable
export class ConsensusParams {
  quorumSize: u16
  sampleSize: u16
  decisionThreshold: u16
}

@serializable
export class ActionSchema {
  function: string
  addNetwork: AddNetworkSchema | null
  registerContracts: RegisterContractsSchema | null
  acceptedContracts: AcceptedContractsSchema | null
  target: string | null
  transfer: TransferSchema | null
  evolve: string | null
}

@serializable
export class TransferSchema {
  target: string
  qty: u32
}

@serializable
export class AddNetworkSchema {
  id: string
  name: string
  desc: string
  url: string
}

@serializable
export class AcceptedContractsSchema {
  networkId: string
}

@serializable
export class RegisterContractsSchema {
  networkId: string
  contracts: string[]
}

@serializable
export class ResultSchema {
  acceptedContracts: string[] | null
  balance: BalanceResultSchema | null
}

export class BalanceResultSchema {
  balance: u64
  target: string
  ticker: string
}
