import { ExecutorError } from '@qlover/fe-corekit/executor';
import { isI18nKey } from '@qlover/next-kit/common';
import { PostgrestError } from '@supabase/supabase-js';

export interface ApiErrorNormalizerOptions {
  /** i18n id every infrastructure failure is remapped to (e.g. `api:server__error`). */
  readonly serverErrorId: string;
  /** Extra non-i18n ids that clients branch on and must pass through unchanged. */
  readonly passthroughIds?: Iterable<string>;
  /**
   * App-specific mapping for thrown values, tried after ExecutorError and
   * PostgrestError. Return `null` to fall through.
   */
  readonly mapThrown?: (
    value: unknown,
    serverErrorId: string
  ) => ExecutorError | null;
  /** Defaults to `NODE_ENV !== 'production'`. */
  readonly isDiagnosticsEnabled?: () => boolean;
}

export interface ApiErrorNormalizer {
  /**
   * Whether an ExecutorError id is a stable client-facing contract id.
   *
   * Business / validation keys look like `api:…` / `common:…` / `next_kit:…`.
   * Infrastructure names such as `SupabasePGRSTError` are not.
   */
  isStableApiErrorId(id: string): boolean;
  /**
   * Dev-only: allow server-error envelopes to include diagnostic `data`
   * (PostgREST code/hint, UNKNOWN_ASYNC cause, …). Production always strips.
   */
  isApiErrorDiagnosticsEnabled(): boolean;
  /**
   * Maps infrastructure ExecutorError ids (e.g. SupabasePGRSTError) onto the
   * server error id. Diagnostic details stay on `cause` for server logs;
   * use {@link ApiErrorNormalizer.toClientFacingExecutorError} before writing
   * the HTTP envelope.
   */
  toStableApiExecutorError(error: ExecutorError): ExecutorError;
  /**
   * Client envelope form: keep business causes; strip infrastructure
   * diagnostics on the server error unless diagnostics are enabled.
   */
  toClientFacingExecutorError(error: ExecutorError): ExecutorError;
  /**
   * Convert thrown Supabase native errors (and ExecutorError) into a stable
   * ExecutorError. Returns `null` when the value should be left to the kit
   * default (generic Error / success).
   */
  toExecutorErrorFromThrown(value: unknown): ExecutorError | null;
}

const NESTED_I18N_KEY = /^[a-z][a-z0-9_-]*(:[a-z][a-z0-9_-]*)+$/i;

export function createApiErrorNormalizer(
  options: ApiErrorNormalizerOptions
): ApiErrorNormalizer {
  const { serverErrorId, mapThrown } = options;
  const passthroughIds = new Set(options.passthroughIds ?? []);
  const isApiErrorDiagnosticsEnabled =
    options.isDiagnosticsEnabled ??
    (() => process.env.NODE_ENV !== 'production');

  const isStableApiErrorId = (id: string): boolean => {
    if (isI18nKey(id)) {
      return true;
    }
    // Keys with nested segments (e.g. `common:v:zod_failed`); kit `isI18nKey`
    // only allows a single colon.
    if (NESTED_I18N_KEY.test(id)) {
      return true;
    }
    return passthroughIds.has(id);
  };

  const toStableApiExecutorError = (error: ExecutorError): ExecutorError => {
    if (isStableApiErrorId(error.id)) {
      return error;
    }

    return new ExecutorError(serverErrorId, {
      source: error.id,
      cause: error.cause
    });
  };

  const toClientFacingExecutorError = (
    error: ExecutorError
  ): ExecutorError => {
    const stable = toStableApiExecutorError(error);
    if (stable.id !== serverErrorId) {
      return stable;
    }
    if (isApiErrorDiagnosticsEnabled() && stable.cause != null) {
      return stable;
    }
    return new ExecutorError(serverErrorId);
  };

  const toExecutorErrorFromThrown = (value: unknown): ExecutorError | null => {
    if (value instanceof ExecutorError) {
      return toStableApiExecutorError(value);
    }

    if (value instanceof PostgrestError) {
      return new ExecutorError(serverErrorId, {
        source: 'PostgrestError',
        code: value.code,
        details: value.details,
        hint: value.hint,
        message: value.message
      });
    }

    return mapThrown?.(value, serverErrorId) ?? null;
  };

  return {
    isStableApiErrorId,
    isApiErrorDiagnosticsEnabled,
    toStableApiExecutorError,
    toClientFacingExecutorError,
    toExecutorErrorFromThrown
  };
}
