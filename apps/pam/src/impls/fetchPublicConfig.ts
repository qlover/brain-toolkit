import { API_PUBLIC_CONFIG } from '@config/route';
import type { PamPublicConfig } from '@schemas/PamSiteSettingsSchema';

const defaultPublicConfig: PamPublicConfig = {
  auth: {
    phoneLoginEnabled: false,
    googleOauthEnabled: false,
    brainPkceEnabled: false,
    brainSupabaseEnabled: false
  }
};

let cachedPublicConfig: PamPublicConfig | null = null;
let inflightPublicConfig: Promise<PamPublicConfig> | null = null;

async function loadPublicConfigFromNetwork(): Promise<PamPublicConfig> {
  try {
    const response = await fetch(API_PUBLIC_CONFIG, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) {
      return defaultPublicConfig;
    }
    return (await response.json()) as PamPublicConfig;
  } catch {
    return defaultPublicConfig;
  }
}

/**
 * Loads login-page feature flags. Concurrent callers share one in-flight request
 * (avoids duplicate fetches under React Strict Mode remount).
 */
export async function fetchPublicConfig(): Promise<PamPublicConfig> {
  if (cachedPublicConfig) {
    return cachedPublicConfig;
  }

  if (inflightPublicConfig) {
    return inflightPublicConfig;
  }

  inflightPublicConfig = loadPublicConfigFromNetwork()
    .then((config) => {
      cachedPublicConfig = config;
      return config;
    })
    .finally(() => {
      inflightPublicConfig = null;
    });

  return inflightPublicConfig;
}

/** Clears module cache (e.g. after site settings change in another tab). */
export function invalidatePublicConfigCache(): void {
  cachedPublicConfig = null;
  inflightPublicConfig = null;
}
