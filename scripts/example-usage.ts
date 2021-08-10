import Arweave from 'arweave';
import * as fs from 'fs';
import HandlerBasedSwcClient from 'smartweave/lib/v2/HandlerBasedSwcClient';
import { ProvidersRegistryState } from '../src/providers-registry/types';
import MemBlockHeightSwCache from 'smartweave/lib/v2/cache/impl/MemBlockHeightCache';
import DebuggableExecutorFactory from 'smartweave/lib/v2/plugins/DebuggableExecutorFactor';
import { EvalStateResult, HandlerExecutorFactory } from 'smartweave/lib/v2';
import ContractDefinitionLoader from 'smartweave/lib/v2/core/impl/ContractDefinitionLoader';
import ContractInteractionsLoader from 'smartweave/lib/v2/core/impl/ContractInteractionsLoader';
import LexicographicalInteractionsSorter from 'smartweave/lib/v2/core/impl/LexicographicalInteractionsSorter';
import MemCache from 'smartweave/lib/v2/cache/impl/MemCache';
import CacheableExecutorFactory from 'smartweave/lib/v2/plugins/CacheableExecutorFactory';


async function readContractState() {

  const arweave = Arweave.init({
    host: 'arweave.net',// Hostname or IP address for a Arweave host
    port: 443,          // Port
    protocol: 'https',  // Network protocol http or https
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
  });

  console.log('arweave created');

  const jwk = readJSON('../redstone-node/.secrets/redstone-dev-jwk.json');

  const changedSrc = fs.readFileSync('dist/providers-registry/providers-registry.contract.js', 'utf-8');

  const cacheableExecutorFactory = new CacheableExecutorFactory<any, any>(arweave, new HandlerExecutorFactory(arweave), new MemCache());

  const debuggableExecutorFactory = new DebuggableExecutorFactory(cacheableExecutorFactory, {
    'OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU': changedSrc
  });

  const swcClient = new HandlerBasedSwcClient<any>(
    arweave,
    new MemBlockHeightSwCache<EvalStateResult<ProvidersRegistryState>>(),
    new ContractDefinitionLoader<ProvidersRegistryState>(arweave, new MemCache()),
    new ContractInteractionsLoader(arweave),
    new LexicographicalInteractionsSorter(arweave),
    debuggableExecutorFactory);

  console.log('swcClient created');

  const result = await swcClient.viewState(
    'OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU', {
      function: 'providerData',
      data: {
        providerId: '33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA',
      },
    }, jwk);

  console.log(result);


  function readJSON(path) {
    const content = fs.readFileSync(path, 'utf-8');
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`File "${path}" does not contain a valid JSON`);
    }
  }
}

readContractState().catch((e) => {
  console.log(e);
});
