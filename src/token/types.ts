import TransferRequest from "../common/common-types";

export interface TokenState {
  contractAdmins: [];

  ticker: string,

  balances: {
    [walletId: string]: number
  }

  stakes: {
    [contractTxId: string]: {
      totalContractStake: number,
      contractStakes: {
        [targetId: string]: {
          totalTargetStake: number
          stakesLog: any[]
        }
      }
    }
  }

  transferRequestsRegistry: WalletTransferRequestsRegistry;
}

// a map from wallet to transfer requests for this wallet
export interface WalletTransferRequestsRegistry {
  [walletId: string]: WalletTransferRequests
}

// a map from transfer request id to processed transfer requests for given wallet
export interface WalletTransferRequests {
  [requestId: string]: ProcessedTransferRequest
}

export interface ProcessedTransferRequest extends TransferRequest {
  status: ProcessedTransferRequestStatus,
  processedTimestamp: number,
  description: string;
}

export type ProcessedTransferRequestStatus = "ok" | "not-enough-balance" | "error";

export interface TokenInput {
  function: TokenGetFunction | TokenSetFunction;
  data: BalanceData | StakeData | TransferData
}

export interface TransferData extends BalanceData {
}

export interface BalanceData {
  target: string,
  qty: number
}

export interface WithdrawData extends StakeData {
  beneficiaryId?: string;
}

export interface StakeData {
  contractName: string,
  targetId: string, // TODO: eg. providerId
  qty: number
}

export interface TokenAction {
  input: TokenInput;
  caller: string;
}

export interface TokenResult {
  target: string,
  ticker: string,
  balance: number
}

export type TokenGetFunction = 'transfer' | 'processStakeRequest';
export type TokenSetFunction = 'balance' | 'stake' | 'withdraw';
