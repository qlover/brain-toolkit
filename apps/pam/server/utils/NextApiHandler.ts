import {
  NextApiHandler as KitNextApiHandler,
  ResultContext,
  type ResultHandlerContext,
  type ResultHandlerInterface
} from '@qlover/next-kit/server';
import { OAuthWrapperError } from '@qlover/oauth-wrapper';
import { oauthWrapperI18n } from '@config/i18n-mapping/oauthWrapperI18n';
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
 * App-side NextApiHandler: extends the kit implementation and maps OAuth
 * RFC error ids to their i18n identifiers.
 */
export class NextApiHandler extends KitNextApiHandler {
  protected override handlerOAuthWrapper<T>(value: T): T {
    if (value instanceof OAuthWrapperError) {
      this.serverContext.changeState({ httpStatus: value.status });
      return toI18nOAuthError(value) as T;
    }
    return value;
  }
}
