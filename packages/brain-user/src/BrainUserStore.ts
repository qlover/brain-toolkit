import {
  UserStateInterface,
  UserStore,
  UserStoreOptions
} from '@qlover/corekit-bridge';
import { BrainUser } from './types/BrainUserTypes';
import { BrainCredentials } from './interface/BrainUserGatewayInterface';
import { createFeatureTags, DynamicFeatureTags } from './FeatureTags';
import { UserProfile } from './UserProfile';
import { BrainUserStoreInterface } from './interface/BrainUserStoreInterface';

export interface BrainUserStateInterface
  extends UserStateInterface<BrainUser, BrainCredentials> {}

export interface BrainUserStoreOptions<Tags extends readonly string[]>
  extends UserStoreOptions<BrainUserStateInterface, string> {
  /**
   * 用户权限标签
   *
   * @default `FeatureTags<Tags>`
   */
  featureTags?: DynamicFeatureTags<Tags>;

  /**
   * 用户 profile
   *
   * @default `UserProfile`
   */
  userProfile?: UserProfile;
}

/**
 * Brain User Store - State management for user data and credentials
 *
 * Significance: Central state container for Brain user information
 * Core idea: Extend UserStore with Brain-specific feature tags and profile management
 * Main function: Store and manage user state, credentials, feature tags, and profile
 * Main purpose: Provide type-safe access to user data with persistence capabilities
 *
 * @example
 * ```ts
 * const store = new BrainUserStore({
 *   storage: localStorage,
 *   persistUserInfo: true,
 *   credentialStorageKey: 'brain_token',
 *   featureTags: createFeatureTags(),
 *   userProfile: new UserProfile({})
 * });
 *
 * // Access user data
 * const user = store.getUserMe();
 *
 * // Check feature tags
 * const hasGenUI = store.featureTags.hasGenUI();
 *
 * // Access profile
 * const phoneNumber = store.userProfile.getPhoneNumber();
 * ```
 */
export class BrainUserStore<Tags extends readonly string[]>
  extends UserStore<BrainUser, BrainCredentials, string>
  implements BrainUserStoreInterface<Tags>
{
  protected featureTagsHandler: DynamicFeatureTags<Tags>;
  protected userProfileHandler: UserProfile;

  constructor(options: BrainUserStoreOptions<Tags>) {
    const { featureTags, userProfile, ...rest } = options;
    super(rest);

    this.featureTagsHandler = featureTags ?? createFeatureTags();
    this.userProfileHandler = userProfile ?? new UserProfile({});
  }

  /**
   * @override
   */
  public getToken(): string {
    return super.getCredential()?.token ?? '';
  }

  /**
   * @override
   */
  public getFeatureTags(): DynamicFeatureTags<Tags> {
    return this.featureTagsHandler;
  }

  /**
   * @override
   */
  public getUserProfile(): UserProfile {
    return this.userProfileHandler;
  }
}

