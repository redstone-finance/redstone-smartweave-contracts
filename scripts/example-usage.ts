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
import { interactRead } from 'smartweave';
import CacheableContractInteractionsLoader from 'smartweave/lib/v2/plugins/CacheableContractInteractionsLoader';


async function readContractState() {

  const cachedArweave = Arweave.init({
    host: 'dh48zl0solow5.cloudfront.net',// Hostname or IP address for a Arweave host
    port: 443,          // Port
    protocol: 'https',  // Network protocol http or https
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
  });

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
    'OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU': changedSrc,
  });

  const interactionsLoader = new ContractInteractionsLoader(cachedArweave);

  const swcClient = new HandlerBasedSwcClient<any>(
    cachedArweave,
    new MemBlockHeightSwCache<EvalStateResult<ProvidersRegistryState>>(),
    new ContractDefinitionLoader<ProvidersRegistryState>(cachedArweave, new MemCache()),
    new CacheableContractInteractionsLoader(interactionsLoader, new MemBlockHeightSwCache()),
    new LexicographicalInteractionsSorter(cachedArweave),
    cacheableExecutorFactory);

  console.log('swcClient created');


  console.time('ViewState');
  const result = await swcClient.viewState(
    'OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU', {
      function: 'providerData',
      data: {
        providerId: '33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA',
        eagerManifestLoad: true,
      },
    }, jwk);
  console.timeEnd('ViewState');


  /*console.time('interactRead')
  const result2 = await interactRead(
    arweave, jwk, 'OrO8n453N6bx921wtsEs-0OCImBLCItNU5oSbFKlFuU',
    {
      function: 'providerData',
      data: {
        providerId: '33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA',
        eagerManifestLoad: true
      },
    });
  console.timeEnd('interactRead');*/


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
