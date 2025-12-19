import {
  UserPluginContext,
  UserServicePluginInterface
} from '@qlover/corekit-bridge';
import { BrainUser } from '../types/BrainUserTypes';
import { BrainCredentials } from './BrainUserGatewayInterface';
import { BrainUserStoreInterface } from './BrainUserStoreInterface';

export interface BrainUserPluginContext<
  User,
  Credential,
  Tags extends readonly string[] = string[]
> extends UserPluginContext<User, Credential> {
  store: BrainUserStoreInterface<Tags>;
}

export interface BrainUserPluginInterface
  extends UserServicePluginInterface<BrainUser, BrainCredentials> {
  onLoginWithGoogleBefore?(
    context: BrainUserPluginContext<BrainUser, BrainUser>
  ): Promise<void> | void;

  onLoginWithGoogleSuccess?(
    context: BrainUserPluginContext<BrainUser, BrainUser>
  ): Promise<void> | void;
}

