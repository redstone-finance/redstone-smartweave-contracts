export default interface TransferRequest {
  id: string,
  targetId: string, //eg. wallet address of the provider registered in providers-registry.contract.ts
  qty: number,
  caller: string,
  timestamp: number,
  type: TransferRequestType;
  owningContractTxId: string;
}

export type TransferRequestType = "stake" | "vest"; // hmm...
