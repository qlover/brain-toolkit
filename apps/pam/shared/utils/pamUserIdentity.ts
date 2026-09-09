/** Internal Supabase placeholder for phone-only auth.users (not a business email). */
export const PHONE_PLACEHOLDER_EMAIL_SUFFIX = '@phone.pam.local';

export function isPhonePlaceholderEmail(
  email: string | null | undefined
): boolean {
  if (!email?.trim()) {
    return false;
  }
  return email.trim().toLowerCase().endsWith(PHONE_PLACEHOLDER_EMAIL_SUFFIX);
}

/** Business email for pam_users: null when missing or placeholder. */
export function toBusinessEmail(
  email: string | null | undefined
): string | null {
  const trimmed = email?.trim() ?? '';
  if (!trimmed || isPhonePlaceholderEmail(trimmed)) {
    return null;
  }
  return trimmed;
}

export function phonePlaceholderEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits
    ? `${digits}${PHONE_PLACEHOLDER_EMAIL_SUFFIX}`
    : `unknown${PHONE_PLACEHOLDER_EMAIL_SUFFIX}`;
}

/** Default display_name for phone-only profiles, e.g. 用户****8000 */
export function defaultDisplayNameFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const tail = digits.slice(-4) || '????';
  return `用户****${tail}`;
}

export function maskPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return phone;
  }
  return `****${digits.slice(-4)}`;
}

/**
 * UI label: display_name → masked phone → real email → short id.
 */
export function resolveUserDisplayLabel(params: {
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
  userId?: string | null;
}): string {
  const name = params.displayName?.trim();
  if (name) {
    return name;
  }
  const phone = params.phone?.trim();
  if (phone) {
    return maskPhoneForDisplay(phone);
  }
  const email = toBusinessEmail(params.email);
  if (email) {
    return email;
  }
  const id = params.userId?.trim() ?? '';
  if (id.length <= 12) {
    return id || 'User';
  }
  return `${id.slice(0, 8)}…`;
}
