import { randomUUID } from 'node:crypto';
import { cookies, headers } from 'next/headers';

export type OAuthConsentDeviceContext = {
  deviceId?: string | null;
  userAgent?: string | null;
};

export interface OAuthConsentDeviceCookie {
  readonly cookieName: string;
  /** Reads device id + user agent. Safe in Server Components (no writes). */
  read(): Promise<OAuthConsentDeviceContext>;
  /** Issues the device cookie when missing. Route Handlers / Actions only. */
  ensure(secure: boolean): Promise<OAuthConsentDeviceContext>;
}

// Browsers cap cookie lifetime at ~400 days; grant expiry is enforced in DB.
const DEVICE_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;
const DEVICE_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

/**
 * httpOnly random device id backing "trust this app on this device".
 */
export function createConsentDeviceCookie(
  cookieName: string
): OAuthConsentDeviceCookie {
  const read = async (): Promise<OAuthConsentDeviceContext> => {
    const [cookieStore, headerStore] = await Promise.all([
      cookies(),
      headers()
    ]);
    const raw = cookieStore.get(cookieName)?.value ?? '';
    return {
      deviceId: DEVICE_ID_PATTERN.test(raw) ? raw : null,
      userAgent: headerStore.get('user-agent')
    };
  };

  const ensure = async (
    secure: boolean
  ): Promise<OAuthConsentDeviceContext> => {
    const device = await read();
    if (device.deviceId) {
      return device;
    }

    const deviceId = randomUUID();
    const cookieStore = await cookies();
    cookieStore.set(cookieName, deviceId, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: DEVICE_COOKIE_MAX_AGE
    });
    return { ...device, deviceId };
  };

  return { cookieName, read, ensure };
}
