import { GetProviderData, ManifestData, ProvidersRegistryAction, ProvidersRegistryState } from '../../types';
import { checkProviderExists, checkProviderId, setManifestContent, updateManifestsStatus } from '../_commons';
import { Tools } from '../../../common/Tools';
import { calculateStakedTokens, getDeposits } from '../write/updateAvailableTokens';

export const providerData = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  const getProviderData = data as GetProviderData;
  checkProviderId(getProviderData.providerId);
  checkProviderExists(getProviderData.providerId, state.providers);

  const providerCopy = Tools.deepCopy(state.providers[getProviderData.providerId]);
  providerCopy.manifests = updateManifestsStatus(providerCopy.manifests);

  const providerDeposit = (await getDeposits())[getProviderData.providerId];
  providerCopy.stakedTokens = calculateStakedTokens(providerDeposit);

  if (getProviderData.eagerManifestLoad) {
    const activeManifest: ManifestData = providerCopy.manifests.find((manifest) => {
      return manifest.status === 'active';
    });
    await setManifestContent(activeManifest);
  }

  return {
    result: { provider: providerCopy },
  };
};
