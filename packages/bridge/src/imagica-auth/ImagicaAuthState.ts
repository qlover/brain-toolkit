import { UserAuthState } from '@qlover/corekit-bridge';
import { UserInfoResponseData } from './ImagicaAuthApi';

export class ImagicaAuthState<
  User extends UserInfoResponseData = UserInfoResponseData
> extends UserAuthState<User> {
  public getUserMe(): UserInfoResponseData | null {
    return this.userInfo ?? null;
  }

  public hasFeature(feature: string): boolean {
    return this.userInfo?.feature_tags?.includes(feature) ?? false;
  }

  public hasPermission(permission: string): boolean {
    return this.userInfo?.profile?.permissions?.includes(permission) ?? false;
  }
}
