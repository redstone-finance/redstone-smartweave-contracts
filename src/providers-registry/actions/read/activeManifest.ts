import { GetProviderManifest, ProvidersRegistryAction, ProvidersRegistryState } from '../../types';
import {
  checkProviderExists,
  checkProviderId,
  getManifestsFor,
  setManifestContent,
  updateManifestsStatus,
} from '../_commons';

export const activeManifest = async (
  state: ProvidersRegistryState,
  { caller, input: { data } }: ProvidersRegistryAction,
) => {
  const activeManifestData = data as GetProviderManifest;
  checkProviderId(activeManifestData.providerId);
  checkProviderExists(activeManifestData.providerId, state.providers);

  const manifests = getManifestsFor(activeManifestData.providerId, state.providers);
  const manifestsWithStatus = updateManifestsStatus(manifests);
  const activeManifest = manifestsWithStatus.find((manifest) => {
    return manifest.status === 'active';
  });
  if (activeManifestData.eagerManifestLoad) {
    await setManifestContent(activeManifest);
  }

  return { result: { manifest: activeManifest } };
};
