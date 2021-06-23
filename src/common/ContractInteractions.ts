import {ProvidersRegistryState} from "../providers-registry/types";
import {TokenState} from "../token/types";
import {isTokenLockingContract, TokenLockingContract} from "./common-types";

declare const SmartWeave;
declare const ContractError;

export const registryTxId = "XQkGzXG6YknJyy-YbakEZvQKAWkW2_aPRhc3ShC8lyA";

/**
 * this class simplifies interactions between RedStone SmartWeave contracts
 */
export class ContractInteractions {

  static async providerContractState(): Promise<ProvidersRegistryState> {
    const providersRegistryTxId = await ContractInteractions.getContractTxId("providers-registry");
    return await SmartWeave.contracts.readContractState(providersRegistryTxId);
  }

  static async tokenContractState(): Promise<TokenState> {
    const contractTxId = await ContractInteractions.getContractTxId("token");
    return await SmartWeave.contracts.readContractState(contractTxId);
  }

  static async generateId(request: any): Promise<string> {
    const stakeRequestBuffer = SmartWeave.arweave.utils.stringToBuffer(request);
    const hash = await SmartWeave.arweave.crypto.hash(stakeRequestBuffer, "SHA-256");
    return SmartWeave.arweave.utils.bufferTob64Url(hash);
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

  static async getContractTxId(contract: string): Promise<string> {
    const contractsRegistry = await SmartWeave.contracts.readContractState(registryTxId);
    return contractsRegistry.versions["v1"].contracts[contract].slice().pop();
  }

}

