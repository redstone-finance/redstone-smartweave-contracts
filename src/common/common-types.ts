import {Validators} from "./Validators";

export interface TokenLockingContract {
  /**
   * the amount of tokens that are available for withdrawn.
   */
  availableTokens: {
    // consider adding "update timestamp"?
    // updates older than X could be considered as "expired"
    // - fresh update should be required in such case?
    [walletId: string]: number;
  }
}

// Type Guard
export function isTokenLockingContract(arg: any): arg is TokenLockingContract {
  return arg.availableTokens !== undefined
    && Validators.isTypeOf(arg.availableTokens,"object");
}

export interface DepositLog {
  from: string;
  qty: number;
  timestamp: number;
}

export interface Deposit {
  /**
   * total number of tokens deposited on given wallet within given contract
   * (eg. tokens staked by given provider in providers-registry contract)
   */
  deposit: number,

  /**
   * total number of tokens withdrawned from given wallet within given contract
   */
  withdraw: number;
  log: DepositLog[];
}
