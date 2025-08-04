import { UserAuthState } from '@qlover/corekit-bridge';
import { UserInfoResponseData } from './ImagicaAuthApi';

export class ImagicaAuthState<
  User extends UserInfoResponseData = UserInfoResponseData
> extends UserAuthState<User> {
  getUserMe(): UserInfoResponseData | null {
    return this.userInfo ?? null;
  }

  hasFeature(feature: string): boolean {
    return this.userInfo?.feature_tags?.includes(feature) ?? false;
  }

  hasPermission(permission: string): boolean {
    return this.userInfo?.profile?.permissions?.includes(permission) ?? false;
  }
}
