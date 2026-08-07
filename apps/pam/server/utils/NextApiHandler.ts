import { ExecutorError } from '@qlover/fe-corekit/executor';
import { type NextKitApiResult } from '@qlover/next-kit/common';
import {
  NextApiHandler as KitNextApiHandler,
  ResultContext,
  type ResultHandlerContext,
  type ResultHandlerInterface
} from '@qlover/next-kit/server';
import { OAuthWrapperError } from '@qlover/oauth-wrapper';
import { oauthWrapperI18n } from '@config/i18n-mapping/oauthWrapperI18n';
import { toStableApiExecutorError } from '@server/utils/normalizeApiExecutorError';
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
 * App-side NextApiHandler: maps OAuth RFC ids to i18n keys, and normalizes
 * non-contract ExecutorError ids to `api:server__error`.
 */
export class NextApiHandler extends KitNextApiHandler {
  /**
   * @override
   */
  public override handler<T>(value: unknown): NextKitApiResult<T> {
    if (value instanceof ExecutorError) {
      return super.handler(toStableApiExecutorError(value));
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
