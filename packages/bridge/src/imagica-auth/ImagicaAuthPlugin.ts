import type {
  ExecutorContext,
  ExecutorPlugin,
  RequestAdapterResponse
} from '@qlover/fe-corekit';
import type {
  ImagicaAuthApiConfig,
  LoginResponseData,
  UserInfoResponseData
} from './ImagicaAuthApi';
import { apiIdentifier, imagicaIdentifier } from './consts';

export class ImagicaAuthPlugin implements ExecutorPlugin<ImagicaAuthApiConfig> {
  public readonly pluginName: string = 'ImagicaApiPlugin';

  public isUserInfo(value: unknown): value is UserInfoResponseData {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'email' in value &&
      'name' in value
    );
  }

  public isLoginResponse(value: unknown): value is LoginResponseData {
    return (
      typeof value === 'object' &&
      value !== null &&
      'token' in value &&
      !!value.token &&
      typeof value.token === 'string'
    );
  }

  /**
   * @override
   */
  public enabled(
    _name: keyof ExecutorPlugin,
    _context?: ExecutorContext<ImagicaAuthApiConfig>
  ): boolean {
    return true;
  }

  /**
   * @override
   */
  public onSuccess?(
    context: ExecutorContext<ImagicaAuthApiConfig>
  ): void | Promise<void> {
    const returnValue = context.returnValue as RequestAdapterResponse<
      ImagicaAuthApiConfig,
      unknown
    >;

    if (typeof returnValue !== 'object') {
      throw new Error(imagicaIdentifier.fatalError);
    }

    const { requestId } = returnValue.config;

    if (requestId === apiIdentifier.login) {
      if (!this.isLoginResponse(returnValue.data)) {
        throw new Error(imagicaIdentifier.notValidLoginResponse);
      }
    }

    if (
      requestId === apiIdentifier.register ||
      requestId === apiIdentifier.getUserInfo
    ) {
      if (!this.isUserInfo(returnValue.data)) {
        throw new Error(imagicaIdentifier.notValidUserInfo);
      }
    }
  }
}
