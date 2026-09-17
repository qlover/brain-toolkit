import { type NextKitApiResult } from '@qlover/next-kit/common';
import {
  NextApiHandler as KitNextApiHandler,
  ResultContext,
  type ResultHandlerContext,
  type ResultHandlerInterface
} from '@qlover/next-kit/server';
import { OAuthWrapperError } from '@qlover/oauth-wrapper';
import { API_SERVER_ERROR } from '@config/i18n-identifier/api';
import { oauthWrapperI18n } from '@config/i18n-mapping/oauthWrapperI18n';
import {
  toClientFacingExecutorError,
  toExecutorErrorFromThrown
} from '@server/utils/normalizeApiExecutorError';
import type { OAuthRfcCodeType } from '@qlover/oauth-wrapper';

export {
  ResultContext,
  type ResultHandlerContext,
  type ResultHandlerInterface
};

function toI18nOAuthError(error: OAuthWrapperError): OAuthWrapperError {
  return new OAuthWrapperError(
    oauthWrapperI18n[error.id as OAuthRfcCodeType] as OAuthRfcCodeType,
    error.status,
    error.cause
  );
}

/**
 * App-side NextApiHandler: maps OAuth RFC ids to i18n keys, remaps unstable
 * ExecutorError ids / native Supabase throws, logs infrastructure details, and
 * strips diagnostic `data` from `api:server__error` in production.
 */
export class NextApiHandler extends KitNextApiHandler {
  /**
   * @override
   */
  public override handler<T>(value: unknown): NextKitApiResult<T> {
    const asExecutor = toExecutorErrorFromThrown(value);
    if (asExecutor) {
      if (asExecutor.id === API_SERVER_ERROR) {
        this.logger.error('API server error', {
          error: value,
          cause: asExecutor.cause
        });
      }
      return super.handler(toClientFacingExecutorError(asExecutor));
    }
    if (value instanceof Error) {
      this.logger.error('Unhandled thrown error', { error: value });
    }
    return super.handler(value);
  }

  protected override handlerOAuthWrapper<T>(value: T): T {
    if (value instanceof OAuthWrapperError) {
      this.serverContext.changeState({ httpStatus: value.status });
      return toI18nOAuthError(value) as T;
    }
    return value;
  }
}
