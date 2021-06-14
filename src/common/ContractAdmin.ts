declare const ContractError;

/**
 * Class that encapsulates "contract admin" feature.
 * Contracts that are using this feature can define separate list of contract admins
 * and list of functions, that can be accessed only by callers from this list.
 */
export class ContractAdmin {

  private constructor(
    private readonly caller: string,
    private readonly contractAdmins: string[],
    private readonly adminFunctions: string[]) {
  }

  static checkAndCreate(
    caller: string,
    fn: string,
    contractAdmins: string[],
    adminFunctions: string[],
    isReadonlyState: boolean = false) {

    if (contractAdmins === undefined || contractAdmins.length === 0) {
      throw new ContractError("At least one contract admin should be defined in initial state during contract deployment.");
    }

    const instance = new ContractAdmin(caller, contractAdmins, adminFunctions)

    if (isReadonlyState) {
      if (!(instance.isAdminFunction(fn) && instance.isContractAdmin())) {
        throw new ContractError("Cannot call state modifying functions in readonly state.")
      }
    }

    if (instance.isAdminFunction(fn) && !instance.isContractAdmin()) {
      throw new ContractError("Administrative functions can be called only by contract admins.");
    }

    return instance;
  }


  isContractAdmin(): boolean {
    return this.contractAdmins.includes(this.caller);
  }

  isAdminFunction(fn: string): boolean {
    return this.adminFunctions.includes(fn);
  }

  checkIsContractAdmin() {
    if (!this.isContractAdmin()) {
      throw new ContractError(`${this.caller} is not the contract admin.`)
    }
  }

  addContractAdmins(newAdmins: string[]) {
    this.checkIsContractAdmin();
    if (newAdmins === undefined || newAdmins.length === 0) {
      throw new ContractError("New contract admins not defined");
    }

    this.contractAdmins.push(...newAdmins);
  }

}
