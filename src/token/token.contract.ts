import {ContractInteractions} from "../common/ContractInteractions";
import {BalanceData, DepositData, TokenAction, TokenResult, TokenState, TransferData, WithdrawData} from "./types";
import {Tools} from "../common/Tools";

declare type ContractResult = { state: TokenState } | { result: TokenResult }
declare const ContractError: any;
declare const SmartWeave: any;

// note: this is a standard token implementation from ff8wOKWGIS6xKlhA8U6t70ydZOozixF5jQMp4yjoTc8
// with added "deposit" and "withdraw" functions.
export async function handle(state: TokenState, action: TokenAction): Promise<ContractResult> {

  const balances = state.balances;
  const input = action.input;
  const caller = action.caller

  switch (input.function) {
    case 'transfer': {
      const transferData = input.data as TransferData;

      const transferTarget = transferData.target;
      const qty = transferData.qty;

      if (!Number.isInteger(qty)) {
        throw new ContractError(`Invalid value for "qty". Must be an integer`);
      }

      if (!transferTarget) {
        throw new ContractError(`No target specified`);
      }

      if (qty <= 0 || caller == transferTarget) {
        throw new ContractError('Invalid token transfer');
      }

      if (balances[caller] < qty) {
        throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
      }

      // Lower the token balance of the caller
      balances[caller] -= qty;
      if (transferTarget in balances) {
        // Wallet already exists in state, add new tokens
        balances[transferTarget] += qty;
      } else {
        // Wallet is new, set starting balance
        balances[transferTarget] = qty;
      }

      return {state};
    }
    case 'balance': {
      const balanceData = input.data as BalanceData;

      const target = balanceData.target;
      const ticker = state.ticker;

      if (typeof target !== 'string') {
        throw new ContractError(`Must specify target to get balance for`);
      }

      if (typeof balances[target] !== 'number') {
        throw new ContractError(`Cannot get balance, target does not exist`);
      }

      return {result: {target, ticker, balance: balances[target]}};
    }

    // allows to "deposit" certain amount of tokens on another contract and walletId.
    // example use-case: someone wants to deposit certain amount of tokens on behalf
    // of stake for certain node in providers-registry.contract (or in a more specific case -
    // a provider himself wants to stake some tokens on his own node).
    case 'deposit': {
      const {contractName, targetId, qty} = input.data as DepositData;
      const from = caller;
      Tools.initIfUndefined(state, "contractDeposits", {});
      Tools.initIfUndefined(state.contractDeposits, contractName, {deposit: 0, withdraw: 0});
      Tools.initIfUndefined(state.contractDeposits[contractName], "wallets", {});
      Tools.initIfUndefined(state.contractDeposits[contractName].wallets, targetId, {
          deposit: 0,
          withdraw: 0,
          log: []
        }
      );

      if (qty <= 0) {
        throw new ContractError("Deposit quantity should be a positive value.");
      }

      if (state.balances[from] === undefined || state.balances[from] < qty) {
        throw new ContractError(`Not enough tokens in wallet ${from}.`);
      }

      state.balances[from] -= qty;

      const contractDeposits = state.contractDeposits[contractName];
      contractDeposits.deposit += qty;

      const walletDeposit = contractDeposits.wallets[targetId];

      walletDeposit.deposit += qty;
      walletDeposit.log.push({
        from: from,
        qty: qty,
        timestamp: SmartWeave.block.timestamp
      });

      return {state};
    }

    // allows to withdraw certain amount of the deposit.
    case 'withdraw': {
      const {contractName, qty} = input.data as WithdrawData;
      if (qty >= 0) {
        throw new ContractError("Withdraw quantity should be a negative value.");
      }

      if (state.contractDeposits === undefined) {
        throw new ContractError("No deposits yet.");
      }

      if (state.contractDeposits[contractName] === undefined) {
        throw new ContractError(`No deposits for ${contractName} yet.`);
      }

      if (state.contractDeposits[contractName].wallets[caller] === undefined) {
        throw new ContractError(`No deposits for ${caller} in ${contractName} yet.`);
      }

      const contractDeposits = state.contractDeposits[contractName];
      const walletDeposit = contractDeposits.wallets[caller];

      const availableTokens = await ContractInteractions.availableTokensViewState(contractName, caller, walletDeposit);
      const totalWithdraw = walletDeposit.withdraw;
      const availableForWithdrawQty = availableTokens - totalWithdraw;

      const toWithdraw = Math.min(Math.abs(qty), availableForWithdrawQty);

      state.balances[caller] += toWithdraw;
      walletDeposit.withdraw += toWithdraw;
      contractDeposits.withdraw += toWithdraw;

      return {state};
    }

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);

  }

}
