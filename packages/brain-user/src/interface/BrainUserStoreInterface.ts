import { UserStoreInterface } from '@qlover/corekit-bridge';
import { BrainUser } from '../types/BrainUserTypes';
import { BrainCredentials } from './BrainUserGatewayInterface';
import { DynamicFeatureTags } from '../FeatureTags';
import { UserProfile } from '../UserProfile';

export interface BrainUserStoreInterface<Tags extends readonly string[]>
  extends UserStoreInterface<BrainUser, BrainCredentials> {
  getToken(): string;

  getFeatureTags(): DynamicFeatureTags<Tags>;

  getUserProfile(): UserProfile;
}

