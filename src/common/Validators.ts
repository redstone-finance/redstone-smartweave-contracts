declare const ContractError;

export class Validators {

  static isEmpty(value: string | any[]): boolean {
    return value === undefined || value.length === 0;
  }

  static isTypeOf(value: any, expectedType: "string" | "number" | "object" | "function"): boolean {
    return typeof value === expectedType;
  }

  static checkWalletAddress(address: string) {
    if (!/[a-z0-9_-]{43}/i.test(address)) {
      throw new ContractError('Invalid Arweave address.');
    }
  }
}
