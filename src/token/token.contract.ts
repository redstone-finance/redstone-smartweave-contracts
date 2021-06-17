import {ContractInteractions} from "../common/ContractInteractions";
import {ProvidersRegistryState} from "../providers-registry/types";
import TransferRequest from "../common/common-types";
import {
  BalanceData,
  ProcessedTransferRequest, ProcessedTransferRequestStatus, StakeData,
  WalletTransferRequestsRegistry,
  TokenAction,
  TokenResult,
  TokenState, TransferData,
  WalletTransferRequests, WithdrawData
} from "./types";
import {Tools} from "../common/Tools";

declare type ContractResult = { state: TokenState } | { result: TokenResult }
declare const ContractError: any;
declare const SmartWeave: any;


// note: this is a standard token implementation from ff8wOKWGIS6xKlhA8U6t70ydZOozixF5jQMp4yjoTc8
export async function handle(state: TokenState, action: TokenAction): Promise<ContractResult> {

  const balances = state.balances;
  const input = action.input;
  const caller = action.caller

  Tools.initIfUndefined(state, "stakeUpdateRegistry", {});
  Tools.initIfUndefined(state.transferRequestsRegistry, caller, {});

  // stake na id kontraktu
  // ew. podawanie callera

  switch (input.function) {
    case 'transfer':
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


      // that's just an alternative to "TransferRequest" implementation that operates directly on token contract.
    case 'stake': {
      const stakeData = input.data as StakeData;
      const contractTxId = await getContractTxId(stakeData.contractName);
      const targetId = stakeData.targetId;
      const from = caller;
      Tools.initIfUndefined(state, "stakes", {});
      Tools.initIfUndefined(state.stakes, contractTxId, {});
      Tools.initIfUndefined(state.stakes[contractTxId], targetId, {});
      Tools.initIfUndefined(state.stakes[contractTxId][targetId], "stakesLog", []);

      if (state.balances[from] === undefined
        || state.balances[from] < stakeData.qty) {
        throw new ContractError(`Not enough mana in wallet ${from}`);
      }

      // TODO: remove from balance or not?
      // TODO: verify that caller is among given provider admins?
      state.balances[targetId] -= stakeData.qty;

      const contractStakes = state.stakes[contractTxId];
      contractStakes.totalContractStake += stakeData.qty;

      const targetStakes = contractStakes[targetId];
      targetStakes.totalContractStake += stakeData.qty;
      targetStakes.stakesLog.push({
        ...stakeData,
        timestamp: SmartWeave.block.timestamp
      });

    }

    case 'withdraw': {
      const withdrawData = input.data as WithdrawData;
      const contractName = withdrawData.contractName;
      const targetContractTxId = await ContractInteractions.getContractTxId(contractName);
      const qty = withdrawData.qty;

      // ask targetContractTxId if qty can be withdrawn by caller
      // but how to do this without interactRead?
      const {total, unlocked} = {total: 1000, unlocked: 500}//await ContractInteractions.providerContractState()
      if (unlocked < qty) {
        throw ContractError(`Cannot withdraw, not enough unlocked tokens on contract ${contractName} `)
      }

    }

    // withdraw
    // weryfikacja ile można wyciągnąć.
    // wyciąganie po "x" dniach.
    // "slash" stake - wyciąganie zastekowanych token-ów i przesłyanie na adres "poszkodowanego"
    //


     case 'balance':
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

    case 'processStakeRequest':

      //TODO: add contactName input param
      await updateProviderStakedTokens();
      return {state};

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);

  }

  async function getContractTxId(contractName: string) {
    try {
      return await ContractInteractions.getContractTxId(contractName);
    } catch (e) {
      throw new ContractError(`Cannot determine txId for contract: ${contractName}`);
    }
  }

  async function updateProviderStakedTokens() {

    const providersRegistryState: ProvidersRegistryState = await ContractInteractions.providerContractState();
    const externalTransferRequests = providersRegistryState.providers[caller].transferRequests;

    if (externalTransferRequests === undefined) {
      return;
    }

    const transferRequestsRegistry: WalletTransferRequests = state.transferRequestsRegistry[caller];

    Object.keys(externalTransferRequests).forEach((requestId) => {
      const transferRequest: TransferRequest = externalTransferRequests[requestId];

      //if given transfer not yet processed by token contract
      if (transferRequestsRegistry[requestId] === undefined) {
        let processedRequest: ProcessedTransferRequest;
        try {
          if (balances[caller] >= transferRequest.qty) {
            // TODO: what about "withdraw" operation?
            balances[caller] -= transferRequest.qty;
            processedRequest = updateRequest(
              transferRequest, "ok", `Staked ${transferRequest.qty} tokens, balance after ${balances[caller]}`);
          } else {
            processedRequest = updateRequest(
              transferRequest, "not-enough-balance", `Stake request: ${transferRequest.qty}, balance: ${balances[caller]}`);
          }
        } catch (e) {
          processedRequest = updateRequest(
            transferRequest, "error", `${JSON.stringify(e)}`);

        }
        transferRequestsRegistry[requestId] = processedRequest;
      }
    });
  }

  function updateRequest(transferRequest: TransferRequest, status: ProcessedTransferRequestStatus, description: string)
    : ProcessedTransferRequest {
    return {
      ...transferRequest,
      status,
      description,
      processedTimestamp: SmartWeave.block.timestamp
    }
  }
}
