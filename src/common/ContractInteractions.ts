import { TokenState } from '../token/types';
import { Deposit, isTokenLockingContract, TokenLockingContract } from './common-types';
import { InteractionResult } from 'smartweave/lib/v2';

declare const SmartWeave;
declare const ContractError;

export const registryTxId = 'Xqrc1aT2oBCReBZhSYmRaUQbTV0iAOJjwLqaEghqQQA';

/**
 * this class simplifies interactions between RedStone SmartWeave contracts
 */
export class ContractInteractions {

  static async tokenContractState(): Promise<TokenState> {
    const contractTxId = await ContractInteractions.getContractTxId('token');
    return await SmartWeave.contracts.readContractState(contractTxId);
  }

  static async availableTokens(contract: string, caller: string): Promise<number> {
    const contractTxId = await ContractInteractions.getContractTxId(contract);
    const calleeState: TokenLockingContract = await SmartWeave.contracts.readContractState(contractTxId) as TokenLockingContract;

    if (!isTokenLockingContract(calleeState)) {
      throw new ContractError(`Calle contract ${contract} state does not implement LockingTokensContract interface.`);
    }

    if (calleeState.availableTokens[caller] === undefined) {
      throw new ContractError(`No available tokens data in ${contract} for ${caller}.
       Did you forget to call 'updateAvailableTokens' function for this caller on
       ${contract} and wait for the transaction to be mined?`);
    }

    return calleeState.availableTokens[caller];
  }

  static async availableTokensViewState(contract: string, caller: string, contractDeposit: Deposit): Promise<number> {
    const contractTxId = await ContractInteractions.getContractTxId(contract);
    const interactionResult: InteractionResult<any, {availableTokens: number}> = await SmartWeave.contracts.viewContractState(
      contractTxId,
      {
        function: 'availableTokens',
        data: {
          providerId: caller,
          deposit: contractDeposit
        },
      });

    if (interactionResult.type !== "ok") {
      throw new ContractError(`No available tokens data in ${contract} for ${caller}.`);
    }

    return interactionResult.result.availableTokens;
  }

  static async getContractTxId(contract: string): Promise<string> {
    const contractsRegistry = await SmartWeave.contracts.viewContractState(
      registryTxId, {
        function: 'contractsCurrentTxId',
        data: {
          contractNames: [contract]
        }
      });

    if (contractsRegistry.type !== 'ok') {
      throw new Error(`Cannot read contract id: ${JSON.stringify(contractsRegistry)}`);
    }

    return contractsRegistry.result[contract];
  }

}
