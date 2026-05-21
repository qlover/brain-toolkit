import type { UserStoreInterface } from '@qlover/corekit-bridge/gateway-service';
import type { BrainUser } from '../types/BrainUserTypes';
import type { BrainCredentials } from './BrainUserGatewayInterface';
import type { DynamicFeatureTags } from '../FeatureTags';
import type { UserProfile } from '../UserProfile';

export interface BrainUserStoreInterface<Tags extends readonly string[]>
  extends UserStoreInterface<BrainUser, BrainCredentials> {
  getToken(): string;

  getAccessToken(): string;

  getFeatureTags(): DynamicFeatureTags<Tags>;

  getUserProfile(): UserProfile;
}
