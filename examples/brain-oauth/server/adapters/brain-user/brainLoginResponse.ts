type BrainLoginLike = Record<string, unknown>;

/**
 * Extracts a brain-user session token from login API payloads.
 *
 * Significance: Isolates Brain login response compatibility quirks.
 * Core idea: Support all known token field variants in one provider helper.
 * Main function: Read `token`, `session_token`, or `auth_token.key`.
 * Main purpose: Keep Brain API response parsing inside the Brain User adapter module.
 *
 * @param data - Unknown Brain login response payload.
 * @returns Trimmed session token, or null when no supported token is present.
 *
 * @example
 * const token = extractBrainSessionToken(loginPayload);
 */
export function extractBrainSessionToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as BrainLoginLike;

  if (typeof obj.token === 'string' && obj.token.trim()) {
    return obj.token.trim();
  }

  if (typeof obj.session_token === 'string' && obj.session_token.trim()) {
    return obj.session_token.trim();
  }

  const authToken = obj.auth_token;
  if (authToken && typeof authToken === 'object') {
    const key = (authToken as BrainLoginLike).key;
    if (typeof key === 'string' && key.trim()) {
      return key.trim();
    }
  }

  return null;
}

/**
 * Formats Brain login error payloads for API responses.
 *
 * Significance: Keeps Brain-specific error payload handling out of OAuth services.
 * Core idea: Convert known Brain and Django-style error shapes to a message.
 * Main function: Read non-field errors, field array errors, or string fields.
 * Main purpose: Return actionable login failures without leaking parsing logic.
 *
 * @param data - Unknown Brain login response payload.
 * @returns Human-readable login failure message.
 *
 * @example
 * throw new Error(formatBrainLoginError(loginPayload));
 */
export function formatBrainLoginError(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'Brain login did not return a session token';
  }

  const obj = data as BrainLoginLike;

  if (Array.isArray(obj.non_field_errors) && obj.non_field_errors.length > 0) {
    return String(obj.non_field_errors[0]);
  }

  for (const [field, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0) {
      return `${field}: ${String(value[0])}`;
    }
    if (typeof value === 'string' && value.trim()) {
      return `${field}: ${value}`;
    }
  }

  return 'Brain login did not return a session token';
}
