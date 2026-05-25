import { injectable } from '@shared/container';
import {
  OAuthAuthorizeQuerySchema,
  OAuthConsentBodySchema,
  type OAuthAuthorizeQuery,
  type OAuthConsentBody
} from '@schemas/oauth/OAuthAuthorizeSchema';
import type {
  ValidationResult,
  ValidatorInterface
} from './ValidatorInterface';

/**
 * Validates OAuth authorize query params and consent POST body.
 */
@injectable()
export class OAuthAuthorizeQueryValidator
  implements ValidatorInterface<OAuthAuthorizeQuery>
{
  /**
   * @override
   */
  public validate(data: unknown): ValidationResult<OAuthAuthorizeQuery> {
    const result = OAuthAuthorizeQuerySchema.safeParse(data);
    if (!result.success) {
      const issue = result.error.issues[0];
      return {
        success: false,
        path: issue?.path ?? [],
        message: issue?.message ?? 'Invalid query'
      };
    }
    return { success: true, data: result.data };
  }

  /**
   * @override
   */
  public getThrow(input: unknown): OAuthAuthorizeQuery {
    return OAuthAuthorizeQuerySchema.parse(input);
  }
}

@injectable()
export class OAuthConsentBodyValidator
  implements ValidatorInterface<OAuthConsentBody>
{
  /**
   * @override
   */
  public validate(data: unknown): ValidationResult<OAuthConsentBody> {
    const result = OAuthConsentBodySchema.safeParse(data);
    if (!result.success) {
      const issue = result.error.issues[0];
      return {
        success: false,
        path: issue?.path ?? [],
        message: issue?.message ?? 'Invalid body'
      };
    }
    return { success: true, data: result.data };
  }

  /**
   * @override
   */
  public getThrow(input: unknown): OAuthConsentBody {
    return OAuthConsentBodySchema.parse(input);
  }
}
