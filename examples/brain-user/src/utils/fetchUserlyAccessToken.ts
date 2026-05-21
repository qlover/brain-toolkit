import type { BrainUserService } from '@brain-toolkit/brain-user';
import { getDeviceUid } from './deviceUid';

/**
 * Exchange brain-user token for userly access_token (matrix-runtime JWT).
 */
export async function fetchUserlyAccessToken(
  userService: BrainUserService<readonly string[]>
): Promise<void> {
  const credential = userService.getCredential();
  if (!credential?.token || credential.access_token) {
    return;
  }

  await userService.fetchAndStoreAccessToken({
    lang: navigator.language?.split('-')[0] ?? 'en',
    appVersion: '1.0.0',
    deviceUid: getDeviceUid()
  });
}
