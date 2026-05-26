/**
 * Accepts HTTPS/HTTP URLs and custom URL schemes (e.g. mobile deep links).
 */
export function isOAuthRedirectUri(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.protocol && parsed.protocol.endsWith(':'));
  } catch {
    return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  }
}
