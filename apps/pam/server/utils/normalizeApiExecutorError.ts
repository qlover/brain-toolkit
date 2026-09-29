import { createApiErrorNormalizer } from '@brain-toolkit/next-app-kit/server';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { isAuthError } from '@supabase/supabase-js';
import { API_SERVER_ERROR } from '@config/i18n-identifier/api';

/**
 * RFC 8628-inspired soft-fail ids used by CLI device token poll.
 * Kept as-is (not remapped to api:*) so pamenv can branch on them.
 */
const RFC8628_SOFT_FAIL_IDS = [
  'authorization_pending',
  'expired_token',
  'access_denied',
  'slow_down'
];

export const {
  isStableApiErrorId,
  isApiErrorDiagnosticsEnabled,
  toStableApiExecutorError,
  toClientFacingExecutorError,
  toExecutorErrorFromThrown
} = createApiErrorNormalizer({
  serverErrorId: API_SERVER_ERROR,
  passthroughIds: RFC8628_SOFT_FAIL_IDS,
  mapThrown: (value, serverErrorId) =>
    isAuthError(value)
      ? new ExecutorError(serverErrorId, {
          source: 'AuthError',
          code: value.code,
          status: value.status,
          message: value.message
        })
      : null
});
