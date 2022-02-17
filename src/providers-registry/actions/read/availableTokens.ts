import {
  AvailableTokensData,
  ProvidersRegistryAction,
  ProvidersRegistryState,
  UpdateAvailableTokensData,
} from '../../types';
import { checkPrivileges, checkProviderExists, checkProviderId } from '../_commons';
import { calculateStakedTokens, getDeposits } from '../write/updateAvailableTokens';

export const availableTokens = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  const { providerId, deposit } = data as AvailableTokensData;
  checkProviderId(providerId);
  checkProviderExists(providerId, state.providers);

  const currentlyStakedTokens = calculateStakedTokens(deposit);

  // just an example implementation
  return { result: { availableTokens: Math.floor(0.5 * currentlyStakedTokens) } };

};
