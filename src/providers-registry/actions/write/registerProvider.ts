import { ProvidersRegistryAction, ProvidersRegistryState, RegisterProviderData } from '../../types';
import { Tools } from '../../../common/Tools';
import { Validators } from '../../../common/Validators';
import { checkProviderProfile } from '../_commons';

declare const ContractError;
declare const SmartWeave;

export const registerProvider = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction
) => {
  const allProviders = state.providers;

  const registerProviderData = data as RegisterProviderData;
  const newProvider = registerProviderData.provider;

  if (allProviders[caller] !== undefined) {
    throw new ContractError(`Provider for ${caller} is already registered.`);
  }

  checkProviderProfile(newProvider.profile, allProviders);

  Tools.initIfUndefined(newProvider, 'manifests', []);

  // initializing adminsPools array if not defined
  if (Validators.isEmpty(newProvider.adminsPool)) {
    registerProviderData.provider.adminsPool = [];
  }

  // adding caller as default admin if not found in adminsPool
  if (!newProvider.adminsPool.includes(caller)) {
    newProvider.adminsPool.push(caller);
  }

  newProvider.registerHeight = SmartWeave.block.height;
  newProvider.profile.id = `provider_${SmartWeave.transaction.id}`;

  allProviders[caller] = newProvider;

  return { state };
};
