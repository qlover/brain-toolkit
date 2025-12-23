// Config exports
export * from './config/EndPoints';
export * from './config/PreFeatureTags';
export * from './config/common';

// Core classes
export * from './BrainUserApi';
export * from './BrainUserGateway';
export * from './BrainUserService';
export * from './BrainUserStore';
export * from './UserProfile';
export * from './FeatureTags';

// Interfaces
export * from './interface/BrainResponse';
export * from './interface/BrainWebTagsCheckerInterface';
export * from './interface/BrainUserPluginInterface';

// Export specific items from BrainUserGatewayInterface to avoid conflicts
export type {
  BrainUserGoogleRequest,
  BrainUserGoogleResponse,
  BrainGatewayRequestMetadata,
  BrainUserRegisterRequest,
  BrainUserRegisterResponse,
  BrainUserRegisterOtpResult,
  BrainGetUserInfoRequest,
  BrainGetUserInfoResponse,
  BrainLoginRequest,
  BrainGoogleCredentials,
  BrainUserGatewayInterface
} from './interface/BrainUserGatewayInterface';

// Types (BrainCredentials will be exported from here as the main source)
export * from './types/BrainUserTypes';

// Utils
export * from './utils/caseConverter';
export * from './utils/createAdapter';
export * from './utils/createBrainUserStore';
export * from './utils/createBrainUserOptions';
