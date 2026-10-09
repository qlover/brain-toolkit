import { createConsentDeviceCookie } from '@brain-toolkit/next-app-kit/server';

export type { OAuthConsentDeviceContext } from '@brain-toolkit/next-app-kit/server';

export const OAUTH_CONSENT_DEVICE_COOKIE = 'brain_oauth_device';

const consentDevice = createConsentDeviceCookie(OAUTH_CONSENT_DEVICE_COOKIE);

/**
 * Reads the consent device id (if any) and user agent. Safe in Server
 * Components — never writes cookies.
 */
export const readConsentDevice = consentDevice.read;

/**
 * Same as {@link readConsentDevice}, but issues the device cookie when
 * missing. Route Handlers / Server Actions only.
 */
export const ensureConsentDevice = consentDevice.ensure;
