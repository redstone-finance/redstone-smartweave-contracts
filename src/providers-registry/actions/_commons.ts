import { ManifestData, ManifestStatus, ProviderData, ProviderProfile, Providers } from '../types';
import { Validators } from '../../common/Validators';

declare const SmartWeave;
declare const ContractError;

const BLOCKS_IN_HOUR = 30;

export function checkProviderProfile(
  profile: ProviderProfile,
  providers: Providers,
) {
  if (profile === undefined) {
    throw new ContractError('Provider profile not defined.');
  }

  if (Validators.isEmpty(profile.name)) {
    throw new ContractError('Provider profile name not defined.');
  }

  const providersNames = Object.values(providers)
    .map((provider: ProviderData) => {
      return provider.profile.name;
    });

  if (providersNames.includes(profile.name)) {
    throw new ContractError(`Provider with ${profile.name} is already registered.`);
  }

  if (Validators.isEmpty(profile.description)) {
    throw new ContractError('Provider profile description not defined.');
  }

  if (Validators.isEmpty(profile.url)) {
    throw new ContractError('Provider profile url not defined.');
  }
}

export function checkProviderExists(providerId: string, providers: Providers) {
  if (providers[providerId] === undefined) {
    throw new ContractError(`Provider with id ${providerId} is not registered.`);
  }
}

export function checkProviderId(providerId: string) {
  if (Validators.isEmpty(providerId)) {
    throw new ContractError('\'providerId\' field is required.');
  }
}


export function checkPrivileges(caller: string, providerId: string, providers: Providers) {
  if (!providers[providerId].adminsPool.includes(caller)) {
    throw new ContractError(`${caller} is not an admin for ${providerId}`);
  }
}

export async function setManifestContent(manifest: ManifestData): Promise<ManifestData> {

  try {
    const manifestContent = await SmartWeave.unsafeClient.transactions.getData(
      manifest.manifestTxId,
      { decode: true, string: true });
    manifest.activeManifestContent = JSON.parse(manifestContent);
    manifest.activeManifestContent.txId = manifest.manifestTxId;
  } catch (e) {
    return null;
  }

  return manifest;
}

export function updateManifestsStatus(manifests: ManifestData[]): ManifestData[] {
  let activeSet = false;
  const manifestsLength = manifests.length;
  const manifestsWithStatus = manifests.slice()
    .reverse() // reverse to easily find most-recent, non-locked manifest.
    .map((manifest, index) => {
      let status: ManifestStatus;
      if (isManifestLocked(manifest)) {
        status = 'locked';
      } else {
        if (activeSet) {
          status = 'historical';
        } else {
          status = 'active';
          activeSet = true;
        }
      }
      // if we're checking last manifest and no manifest has "active" status set so far
      // - we're setting "active" status to the last manifest on the reversed list (ie. first added).
      if (index == manifestsLength - 1 && !activeSet) {
        status = 'active';
        activeSet = true;
      }

      return {
        ...manifest,
        status,
      };
    });

  // sanity-check..
  checkExactOneManifestIsActive(manifestsWithStatus);

  // un-reverse to restore original order (ie. order in which manifests where added).
  return manifestsWithStatus.reverse();
}

export function checkExactOneManifestIsActive(manifestsWithStatus: ManifestData[]) {
  const activeManifests = manifestsWithStatus.filter((manifest) => {
    return manifest.status === 'active';
  });

  if (activeManifests.length !== 1) {
    throw new ContractError('Exact one manifest should have \'active\' status set.');
  }
}

export function isManifestLocked(manifest: ManifestData) {
  return manifest.uploadBlockHeight + (manifest.lockedHours * BLOCKS_IN_HOUR) > SmartWeave.block.height;
}

export function getManifestsFor(providerId: string, providers: Providers): ManifestData[] {
  const manifests = providers[providerId].manifests;
  if (manifests === undefined || manifests.length === 0) {
    throw new ContractError(`No manifests defined for ${providerId}`);
  }
  return manifests;
}
