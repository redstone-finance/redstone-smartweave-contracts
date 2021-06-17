import Arweave from "arweave/node";
import {createContractExecutionEnvironment} from "smartweave/lib/contract-load"
import {ContractHandler, ContractInteractionResult, execute} from "smartweave/lib/contract-step";
import {SmartWeaveGlobal} from "smartweave/lib/smartweave-global";
import {InteractionTx} from "smartweave/lib/interaction-tx";

export type ContractExecutionEnv = {
  handler: ContractHandler;
  swGlobal: SmartWeaveGlobal;
}

export type Block = {
  height: number,
  timestamp: number
}

export type Contract = {
  src: string,
  txId: string;
  initialState: any
}

export default class ContractsTestingEnv {

  readonly contractId: string;

  private readonly contracts: {
    [contractId: string]: {
      env: ContractExecutionEnv,
      states: any[]
    },
  }

  constructor() {
    this.contracts = {};
    this.pushState = this.pushState.bind(this);
    this.currentState = this.currentState.bind(this);
    this.clearContracts = this.clearContracts.bind(this);
    this.readContract = this.readContract.bind(this);
    this.history = this.history.bind(this);
  }

  deploy(contract: Contract): string {
    return this.deployContract(contract.src, contract.initialState, contract.txId);
  }

  /**
   * deploys new contract and returns its contractId
   */
  deployContract(
    srcPath: string,// from the project's root.
    initialState: any = {},
    contractId: string = `TEST-${srcPath}`): string {

    if (srcPath === undefined || srcPath.length === 0) {
      throw new Error("srcPath is required.");
    }

    const result = require('esbuild').buildSync({
      entryPoints: [`${process.cwd()}/${srcPath}`],
      minify: false,
      bundle: true,
      format: "iife",
      write: false
    });

    const source = new TextDecoder().decode(result.outputFiles[0].contents);
    const env: ContractExecutionEnv = createContractExecutionEnvironment(
      Arweave.init({}), source, this.contractId);

    env.swGlobal.contracts.readContractState = jest.fn().mockImplementation((contractId) => {
      return this.currentState(contractId);
    });

    this.contracts[contractId] = {
      env,
      states: [initialState]
    }

    return contractId;
  };

  async interact<INPUT>(
    caller: string,
    contractId: string,
    input: INPUT = null,
    block: Block = null,
    forcedCurrentState: any = null): Promise<ContractInteractionResult> {

    // note: no need to copy state here, as it is copied by execute method:
    // https://github.com/ArweaveTeam/SmartWeave/blob/788a974e66494ef2ab8f876024e72bf363d4c4a4/src/contract-step.ts#L56
    const currentState = forcedCurrentState || this.currentState(contractId);

    const prevActiveTx = this.contracts[contractId].env.swGlobal._activeTx;
    this.contracts[contractId].env.swGlobal._activeTx = ContractsTestingEnv.mockActiveTx(block || {height: 1000, timestamp: 5555});

    const res: ContractInteractionResult = await execute(
      this.contracts[contractId].env.handler,
      {
        input,
        caller
      },
      currentState);

    if (res.type === 'error' || res.type === 'exception') {
      throw Error(res.result);
    }

    this.pushState(contractId, res.state || currentState);
    this.contracts[contractId].env.swGlobal._activeTx = prevActiveTx;

    return res;
  }

  clearState(contractId: string) {
    this.contracts[contractId].states = [];
  }

  clearContracts() {
    Object.keys(this.contracts).forEach((key: string) => {
      delete this.contracts[key];
    });
  }

  pushState(contractId: string, state: any) {
    this.contracts[contractId].states.push(state);
  }

  readContract(contractId: string) {
    return this.currentState(contractId);
  }

  contractEnv(contractId: string) {
    return this.contracts[contractId].env;
  }

  history(contractId: string) {
    return this.contracts[contractId].states;
  }

  private currentState(contractId: string) {
    const statesLength = this.contracts[contractId].states.length;
    if (statesLength === 0) {
      return {};
    } else {
      return this.contracts[contractId].states[statesLength - 1];
    }
  }

  private static mockActiveTx(mockBlock: Block): InteractionTx {
    return {
      id: `TX-ID-${mockBlock.height}`,
      owner: {
        address: "tx.owner.address",
      },
      recipient: "tx.recipient",
      tags: {},
      fee: {
        winston: "444",
      },
      quantity: {
        winston: "333",
      },
      block: {
        height: mockBlock.height,
        id: `BLOCK-${Date.now()}`,
        timestamp: mockBlock.timestamp,
      },
    };
  }
}
