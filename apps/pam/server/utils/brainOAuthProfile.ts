import { ExecutorError } from '@qlover/fe-corekit/executor';
import { normalizePhoneE164 } from '@shared/utils/pamUserIdentity';
import { API_USER_NOT_FOUND } from '@config/i18n-identifier/api';

/** brain-oauth `/oauth/userinfo` claims. */
export type BrainUserInfo = {
  sub?: string;
  /** Empty string for phone-only Brain accounts. */
  email?: string;
  email_verified?: boolean;
  name?: string;
  phone_number?: string;
};

export type BrainProfile = {
  sub: string;
  /** Business email; empty when the Brain account has none. */
  email: string;
  emailVerified: boolean;
  name: string | null;
  /** E.164, matching phone-OTP accounts. */
  phone: string | null;
};

export function toBrainProfile(info: BrainUserInfo): BrainProfile {
  const sub = info.sub?.trim();
  if (!sub) {
    throw new ExecutorError(API_USER_NOT_FOUND, 'Brain userinfo missing sub');
  }
  const email = info.email?.trim() ?? '';
  const phone = info.phone_number?.trim()
    ? normalizePhoneE164(info.phone_number)
    : '';
  // brain-oauth falls back to email / sub when the account has no name.
  const name = info.name?.trim() ?? '';
  return {
    sub,
    email,
    emailVerified: Boolean(email) && info.email_verified === true,
    name: name && name !== email && name !== sub ? name : null,
    phone: phone || null
  };
}
