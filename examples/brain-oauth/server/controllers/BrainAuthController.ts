import { ExecutorError } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import { LoginValidator } from '@shared/validators/LoginValidator';
import type { ValidatorInterface } from '@shared/validators/ValidatorInterface';
import { API_OAUTH_BRAIN_AUTH_FAILED } from '@config/i18n-identifier/api';
import type { LoginSchema } from '@schemas/LoginSchema';
import { BrainAuthService } from '../services/BrainAuthService';
import type {
  BrainAuthServiceInterface,
  BrainVerifyLoginResult
} from '../interfaces/BrainAuthServiceInterface';

/**
 * HTTP entry for Brain OAuth login: validates input and delegates to {@link BrainAuthService}.
 */
@injectable()
export class BrainAuthController {
  constructor(
    @inject(LoginValidator)
    protected loginValidator: ValidatorInterface<LoginSchema>,
    @inject(BrainAuthService)
    protected brainAuthService: BrainAuthServiceInterface
  ) {}

  /**
   * Validates credentials and performs Brain login via service layer.
   */
  public async verifyBrainLogin(
    requestBody: unknown
  ): Promise<BrainVerifyLoginResult> {
    const body = await this.loginValidator.getThrow(requestBody);

    try {
      return await this.brainAuthService.verifyLogin({
        email: body.email,
        password: body.password
      });
    } catch (err) {
      throw new ExecutorError(
        API_OAUTH_BRAIN_AUTH_FAILED,
        err instanceof Error ? err.message : 'Brain login failed'
      );
    }
  }
}
