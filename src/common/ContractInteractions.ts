import TransferRequest from "./common-types";
import {ProvidersRegistryState} from "../providers-registry/types";
import {TokenState} from "../token/types";

declare const SmartWeave;

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
    const providersRegistryTxId = await ContractInteractions.getContractTxId("token");
    return await SmartWeave.contracts.readContractState(providersRegistryTxId);
  }

  static async generateId(request: any): Promise<string> {
    const stakeRequestBuffer = SmartWeave.arweave.utils.stringToBuffer(request);
    const hash = await SmartWeave.arweave.crypto.hash(stakeRequestBuffer, "SHA-256");
    return SmartWeave.arweave.utils.bufferTob64Url(hash);
  }

  static async getContractTxId(contract: string): Promise<string> {
    const contractsRegistry = await SmartWeave.contracts.readContractState(registryTxId);
    return contractsRegistry.versions["v1"].contracts[contract].pop();
  }

}
