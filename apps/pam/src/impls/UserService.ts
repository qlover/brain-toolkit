import {
  UserService as CorekitBridgeUserService,
  AsyncStore,
  createAsyncState,
  type StoreInterface
} from '@qlover/corekit-bridge';
import {
  userSchema,
  type UserCredential,
  type UserSchema
} from '@qlover/next-kit/common';
import { SignOtpResult, SignWithOtpParams } from '@qlover/oauth-wrapper';
import { isObject, isString } from 'lodash-es';
import { inject, injectable } from '@shared/container';
import { API_REFRESH_USER_INFO_FAILED } from '@config/i18n-identifier/api';
import type { PamSessionCapabilities } from '@schemas/PamUserSchema';
import type { PamSessionCapabilitiesStateInterface } from '@interfaces/PamSessionCapabilitiesInterface';
import type {
  UserServiceGatewayInterface,
  UserServiceInterface
} from '@interfaces/UserServiceInterface';
import { AppUserGateway } from './AppUserGateway';
import type { AppApiConfig } from './appApi/AppApiRequester';
import type {
  SliceStoreAdapter,
  UserStateInterface
} from '@qlover/corekit-bridge';

function defaultCapabilitiesState(): PamSessionCapabilitiesStateInterface {
  return Object.assign(createAsyncState(), {
    platformAdmin: false,
    result: { platformAdmin: false }
  });
}

@injectable()
export class UserService
  extends CorekitBridgeUserService<UserSchema, UserCredential>
  implements UserServiceInterface
{
  protected readonly capabilitiesStore: AsyncStore<
    PamSessionCapabilitiesStateInterface,
    string
  >;

  constructor(
    @inject(AppUserGateway)
    userApi: UserServiceGatewayInterface
  ) {
    super(userApi, {
      pullUserWithLogin: false
    });
    this.capabilitiesStore = new AsyncStore<
      PamSessionCapabilitiesStateInterface,
      string
    >({
      defaultState: defaultCapabilitiesState
    });
  }

  /**
   * @override
   */
  public override get gateway(): UserServiceGatewayInterface {
    return super.gateway as UserServiceGatewayInterface;
  }

  /**
   * @override
   */
  public getToken(): string {
    return this.getStore().getCredential()?.credential_token ?? '';
  }

  /**
   * Get the UI store instance
   *
   * UserStore 默认使用 SliceStoreAdapter 实现，所以需要返回 SliceStoreAdapter 实例
   *
   * 如果需要使用其他实现，可以重写这个方法
   *
   * @returns The UI store instance
   */
  public getUIStore(): SliceStoreAdapter<
    UserStateInterface<UserSchema, UserCredential>
  > {
    return this.getStore().getStore() as SliceStoreAdapter<
      UserStateInterface<UserSchema, UserCredential>
    >;
  }

  /**
   * @override
   */
  public getCapabilitiesStore(): StoreInterface<PamSessionCapabilitiesStateInterface> {
    return this.capabilitiesStore.getStore();
  }

  public applySessionCapabilities(capabilities: PamSessionCapabilities): void {
    this.capabilitiesStore.emit({
      platformAdmin: capabilities.platformAdmin,
      result: { platformAdmin: capabilities.platformAdmin }
    });
  }

  public clearSessionCapabilities(): void {
    const reset = defaultCapabilitiesState();
    this.capabilitiesStore.emit(reset);
  }

  /**
   * @override
   */
  public isUser(value: unknown): value is UserSchema {
    return userSchema.safeParse(value).success;
  }

  /**
   * @override
   */
  public isCredential(value: unknown): value is UserCredential {
    return (
      isObject(value) &&
      'credential_token' in value &&
      isString(value.credential_token)
    );
  }

  public refreshUser(params?: AppApiConfig): Promise<boolean> {
    if (this.isAuthenticated()) {
      return Promise.resolve(true);
    }

    this.getStore().start();

    return this.gateway
      .fetchSession(params)
      .then((session) => {
        if (session.user && this.isUser(session.user)) {
          this.getStore().success(session.user, {
            credential_token: session.user.credential_token ?? ''
          });
          this.applySessionCapabilities(session.capabilities);
          return true;
        }

        this.clearSessionCapabilities();
        this.getStore().failed(API_REFRESH_USER_INFO_FAILED);
        return false;
      })
      .catch((error) => {
        this.clearSessionCapabilities();
        this.getStore().failed(error);
        return false;
      });
  }

  /**
   * @override
   */
  public async logout<R = void>(
    params?: unknown,
    config?: unknown
  ): Promise<R> {
    await super.logout(params, config);
    this.clearSessionCapabilities();
    return undefined as R;
  }

  public async sendOtp(params: SignWithOtpParams): Promise<SignOtpResult> {
    return this.gateway.sendOtp(params);
  }

  public async verifyOtp(
    params: { phone: string; token: string } | { email: string; token: string }
  ): Promise<SignOtpResult> {
    return this.gateway.verifyOtp(params);
  }
}
