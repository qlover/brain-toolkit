import { ExecutorError } from '@qlover/fe-corekit/executor';
import { isI18nKey } from '@qlover/next-kit/common';
import { PostgrestError, isAuthError } from '@supabase/supabase-js';
import { API_SERVER_ERROR } from '@config/i18n-identifier/api';

/**
 * RFC 8628-inspired soft-fail ids used by CLI device token poll.
 * Kept as-is (not remapped to api:*) so pamenv can branch on them.
 */
const RFC8628_SOFT_FAIL_IDS = new Set([
  'authorization_pending',
  'expired_token',
  'access_denied',
  'slow_down'
]);

/**
 * Whether an ExecutorError id is a stable client-facing contract id.
 *
 * Business / validation keys look like `api:…` / `common:…` / `next_kit:…`.
 * Infrastructure names such as `SupabasePGRSTError` are not.
 */
export function isStableApiErrorId(id: string): boolean {
  if (isI18nKey(id)) {
    return true;
  }
  // Keys with nested segments (e.g. `common:v:zod_failed`); kit `isI18nKey`
  // only allows a single colon.
  if (/^[a-z][a-z0-9_-]*(:[a-z][a-z0-9_-]*)+$/i.test(id)) {
    return true;
  }
  return RFC8628_SOFT_FAIL_IDS.has(id);
}

/**
 * Dev-only: allow `api:server__error` envelopes to include diagnostic `data`
 * (PostgREST code/hint, UNKNOWN_ASYNC cause, …). Production always strips.
 */
export function isApiErrorDiagnosticsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Maps kit infrastructure ExecutorError ids (e.g. SupabasePGRSTError) onto
 * {@link API_SERVER_ERROR}. Diagnostic details stay on `cause` for server logs;
 * use {@link toClientFacingExecutorError} before writing the HTTP envelope.
 */
export function toStableApiExecutorError(error: ExecutorError): ExecutorError {
  if (isStableApiErrorId(error.id)) {
    return error;
  }

  return new ExecutorError(API_SERVER_ERROR, {
    source: error.id,
    cause: error.cause
  });
}

/**
 * Client envelope form: keep business `api:*` causes; strip infrastructure
 * diagnostics on {@link API_SERVER_ERROR} unless diagnostics are enabled.
 */
export function toClientFacingExecutorError(
  error: ExecutorError
): ExecutorError {
  const stable = toStableApiExecutorError(error);
  if (stable.id !== API_SERVER_ERROR) {
    return stable;
  }
  if (isApiErrorDiagnosticsEnabled() && stable.cause != null) {
    return stable;
  }
  return new ExecutorError(API_SERVER_ERROR);
}

/**
 * Convert thrown Supabase native errors (and ExecutorError) into a stable
 * {@link ExecutorError} for {@link NextApiHandler}. Returns `null` when the
 * value should be left to the kit default (generic Error / success).
 */
export function toExecutorErrorFromThrown(
  value: unknown
): ExecutorError | null {
  if (value instanceof ExecutorError) {
    return toStableApiExecutorError(value);
  }

  if (value instanceof PostgrestError) {
    return new ExecutorError(API_SERVER_ERROR, {
      source: 'PostgrestError',
      code: value.code,
      details: value.details,
      hint: value.hint,
      message: value.message
    });
  }

  if (isAuthError(value)) {
    return new ExecutorError(API_SERVER_ERROR, {
      source: 'AuthError',
      code: value.code,
      status: value.status,
      message: value.message
    });
  }

  return null;
}
