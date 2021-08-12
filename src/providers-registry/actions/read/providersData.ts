import { ProviderData, ProvidersRegistryAction, ProvidersRegistryState } from '../../types';
import { updateManifestsStatus } from '../_commons';
import { Tools } from '../../../common/Tools';
import { calculateStakedTokens, getDeposits } from '../write/updateAvailableTokens';

export const providersData = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  const providersCopy: { [providerAddress: string]: ProviderData } = Tools.deepCopy(state.providers);
  const deposits = await getDeposits();
  Object.keys(providersCopy).forEach((key) => {
    const provider = providersCopy[key];
    provider.manifests = updateManifestsStatus(provider.manifests);
    provider.stakedTokens = calculateStakedTokens(deposits[key]);
  });

  return {
    result: { providers: providersCopy },
  };
};
