import { ProvidersRegistryAction, ProvidersRegistryState, RemoveProviderData } from '../../types';
import { checkPrivileges, checkProviderExists, checkProviderId } from '../_commons';

export const updateProviderProfile = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  const removeProviderData = data as RemoveProviderData;
  checkProviderId(removeProviderData.providerId);
  checkProviderExists(removeProviderData.providerId, state.providers);
  checkPrivileges(caller, removeProviderData.providerId, state.providers);

  delete state.providers[removeProviderData.providerId];

  return { state };
};
