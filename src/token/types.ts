import {Deposit} from "../common/common-types";

export interface TokenState {
  contractAdmins: [];

  ticker: string,

  balances: {
    [walletId: string]: number
  }

  contractDeposits: {
    [contractName: string]: {
      /**
       * total number of tokens deposited to given contract - ie. sum of all tokens
       * deposited by wallets within this contract
       */
      deposit: number,

      /**
       * total number of tokens withdrawned from the contract - ie. sum of all tokens
       * withdrawned from wallets within this contract
       *
       * currentDeposit = deposit - withdraw
       */
      withdraw: number
      wallets: {
        [walletId: string]: Deposit
      }
    }
  }
}

export interface TokenInput {
  function: TokenGetFunction | TokenSetFunction;
  data: BalanceData | DepositData | TransferData
}

export interface TransferData extends BalanceData {
}

export interface BalanceData {
  target: string,
  qty: number
}

export interface WithdrawData extends DepositData {
  beneficiaryId?: string;
}

export interface DepositData {
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
export type TokenSetFunction = 'balance' | 'deposit' | 'withdraw' | 'slash';
