/**
 * UserProfile test-suite
 *
 * Coverage:
 * 1. constructor           - Profile initialization
 * 2. getProfile/setProfile - Complete profile operations
 * 3. updateProfile         - Partial profile updates
 * 4. Phone number          - Phone number getter/setter
 * 5. DA email              - DA email getter/setter
 * 6. DA email password     - DA email password getter/setter
 * 7. Certificate           - Certificate getter/setter
 * 8. Permissions           - Permission management (CRUD operations)
 * 9. Profile image         - Profile image URL operations
 * 10. Amplitude device ID  - Amplitude device ID getter/setter
 * 11. Email verification   - Email verification status
 * 12. Edge cases           - Null, undefined, and empty values
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserProfile } from '../src/UserProfile';
import type {
  BrainUserProfileInterface,
  BrainUserPermissions
} from '../src/types/BrainUserTypes';

describe('UserProfile', () => {
  let profile: UserProfile;
  let mockProfileData: BrainUserProfileInterface;

  beforeEach(() => {
    mockProfileData = {
      phone_number: '+1234567890',
      da_email: 'user@example.com',
      da_email_password: 'password123',
      certificate: 'cert123',
      permissions: [
        { key: 'restricted_resources', value: ['exec-poll', 'lambda'] },
        { key: 'ably_api_key', value: ['key123'] }
      ],
      profile_img_url:
        'https://s3.amazonaws.com/Brain-user-profile-images/123.jpg',
      amplitude_device_id: 'device123',
      email_verified: true
    };

    profile = new UserProfile(mockProfileData);
  });

  describe('constructor', () => {
    it('should create instance with complete profile data', () => {
      expect(profile).toBeInstanceOf(UserProfile);
      expect(profile.getProfile()).toEqual(mockProfileData);
    });

    it('should create instance with empty profile', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile).toBeInstanceOf(UserProfile);
      expect(emptyProfile.getProfile()).toEqual({});
    });

    it('should create instance with partial profile data', () => {
      const partialData: BrainUserProfileInterface = {
        phone_number: '+1234567890',
        email_verified: true
      };

      const partialProfile = new UserProfile(partialData);
      expect(partialProfile.getPhoneNumber()).toBe('+1234567890');
      expect(partialProfile.isEmailVerified()).toBe(true);
      expect(partialProfile.getDaEmail()).toBeUndefined();
    });
  });

  describe('getProfile and setProfile', () => {
    it('should get complete profile', () => {
      const result = profile.getProfile();
      expect(result).toEqual(mockProfileData);
    });

    it('should set complete profile', () => {
      const newProfileData: BrainUserProfileInterface = {
        phone_number: '+9876543210',
        da_email: 'new@example.com'
      };

      profile.setProfile(newProfileData);
      expect(profile.getProfile()).toEqual(newProfileData);
    });

    it('should replace entire profile when setting', () => {
      const newProfileData: BrainUserProfileInterface = {
        phone_number: '+9876543210'
      };

      profile.setProfile(newProfileData);
      expect(profile.getProfile()).toEqual(newProfileData);
      expect(profile.getDaEmail()).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('should update partial profile data', () => {
      profile.updateProfile({
        phone_number: '+9876543210'
      });

      expect(profile.getPhoneNumber()).toBe('+9876543210');
      expect(profile.getDaEmail()).toBe('user@example.com'); // Should remain unchanged
    });

    it('should update multiple fields', () => {
      profile.updateProfile({
        phone_number: '+9876543210',
        da_email: 'updated@example.com',
        email_verified: false
      });

      expect(profile.getPhoneNumber()).toBe('+9876543210');
      expect(profile.getDaEmail()).toBe('updated@example.com');
      expect(profile.isEmailVerified()).toBe(false);
    });

    it('should handle empty update', () => {
      const originalProfile = profile.getProfile();
      profile.updateProfile({});

      expect(profile.getProfile()).toEqual(originalProfile);
    });
  });

  describe('phone number operations', () => {
    it('should get phone number', () => {
      expect(profile.getPhoneNumber()).toBe('+1234567890');
    });

    it('should set phone number', () => {
      profile.setPhoneNumber('+9876543210');
      expect(profile.getPhoneNumber()).toBe('+9876543210');
    });

    it('should handle undefined phone number', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.getPhoneNumber()).toBeUndefined();
    });

    it('should update phone number', () => {
      const newNumber = '+1111111111';
      profile.setPhoneNumber(newNumber);
      expect(profile.getPhoneNumber()).toBe(newNumber);
    });
  });

  describe('DA email operations', () => {
    it('should get DA email', () => {
      expect(profile.getDaEmail()).toBe('user@example.com');
    });

    it('should set DA email', () => {
      profile.setDaEmail('new@example.com');
      expect(profile.getDaEmail()).toBe('new@example.com');
    });

    it('should handle undefined DA email', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.getDaEmail()).toBeUndefined();
    });
  });

  describe('DA email password operations', () => {
    it('should get DA email password', () => {
      expect(profile.getDaEmailPassword()).toBe('password123');
    });

    it('should set DA email password', () => {
      profile.setDaEmailPassword('newPassword456');
      expect(profile.getDaEmailPassword()).toBe('newPassword456');
    });

    it('should handle undefined DA email password', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.getDaEmailPassword()).toBeUndefined();
    });
  });

  describe('certificate operations', () => {
    it('should get certificate', () => {
      expect(profile.getCertificate()).toBe('cert123');
    });

    it('should set certificate', () => {
      profile.setCertificate('newCert456');
      expect(profile.getCertificate()).toBe('newCert456');
    });

    it('should handle undefined certificate', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.getCertificate()).toBeUndefined();
    });
  });

  describe('permissions operations', () => {
    it('should get all permissions', () => {
      const permissions = profile.getPermissions();
      expect(permissions).toEqual([
        { key: 'restricted_resources', value: ['exec-poll', 'lambda'] },
        { key: 'ably_api_key', value: ['key123'] }
      ]);
    });

    it('should return empty array when no permissions', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.getPermissions()).toEqual([]);
    });

    it('should set permissions', () => {
      const newPermissions: BrainUserPermissions[] = [
        { key: 'new_permission', value: ['value1', 'value2'] }
      ];

      profile.setPermissions(newPermissions);
      expect(profile.getPermissions()).toEqual(newPermissions);
    });

    it('should check if permission exists', () => {
      expect(profile.hasPermission('restricted_resources')).toBe(true);
      expect(profile.hasPermission('ably_api_key')).toBe(true);
      expect(profile.hasPermission('nonexistent')).toBe(false);
    });

    it('should get permission values by key', () => {
      const values = profile.getPermissionValues('restricted_resources');
      expect(values).toEqual(['exec-poll', 'lambda']);
    });

    it('should return undefined for nonexistent permission key', () => {
      const values = profile.getPermissionValues('nonexistent');
      expect(values).toBeUndefined();
    });

    it('should add new permission', () => {
      profile.addPermission('new_key', ['value1', 'value2']);

      expect(profile.hasPermission('new_key')).toBe(true);
      expect(profile.getPermissionValues('new_key')).toEqual([
        'value1',
        'value2'
      ]);
    });

    it('should update existing permission', () => {
      profile.addPermission('restricted_resources', ['new_value']);

      expect(profile.getPermissionValues('restricted_resources')).toEqual([
        'new_value'
      ]);
    });

    it('should remove permission', () => {
      const result = profile.removePermission('restricted_resources');

      expect(result).toBe(true);
      expect(profile.hasPermission('restricted_resources')).toBe(false);
    });

    it('should return false when removing nonexistent permission', () => {
      const result = profile.removePermission('nonexistent');
      expect(result).toBe(false);
    });

    it('should handle multiple permission operations', () => {
      // Add
      profile.addPermission('perm1', ['val1']);
      expect(profile.hasPermission('perm1')).toBe(true);

      // Update
      profile.addPermission('perm1', ['val2']);
      expect(profile.getPermissionValues('perm1')).toEqual(['val2']);

      // Remove
      profile.removePermission('perm1');
      expect(profile.hasPermission('perm1')).toBe(false);
    });
  });

  describe('profile image operations', () => {
    it('should get profile image URL', () => {
      expect(profile.getProfileImageUrl()).toBe(
        'https://s3.amazonaws.com/Brain-user-profile-images/123.jpg'
      );
    });

    it('should set profile image URL', () => {
      const newUrl = 'https://example.com/new-image.jpg';
      profile.setProfileImageUrl(newUrl);
      expect(profile.getProfileImageUrl()).toBe(newUrl);
    });

    it('should check if profile has image', () => {
      expect(profile.hasProfileImage()).toBe(true);
    });

    it('should return false when no profile image', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.hasProfileImage()).toBe(false);
    });

    it('should return false when profile image is empty string', () => {
      const profileWithEmptyUrl = new UserProfile({ profile_img_url: '' });
      expect(profileWithEmptyUrl.hasProfileImage()).toBe(false);
    });
  });

  describe('amplitude device ID operations', () => {
    it('should get amplitude device ID', () => {
      expect(profile.getAmplitudeDeviceId()).toBe('device123');
    });

    it('should set amplitude device ID', () => {
      profile.setAmplitudeDeviceId('newDevice456');
      expect(profile.getAmplitudeDeviceId()).toBe('newDevice456');
    });

    it('should handle undefined amplitude device ID', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.getAmplitudeDeviceId()).toBeUndefined();
    });

    it('should handle complex amplitude device ID', () => {
      const complexId = { id: '123', timestamp: Date.now() };
      profile.setAmplitudeDeviceId(complexId);
      expect(profile.getAmplitudeDeviceId()).toEqual(complexId);
    });
  });

  describe('email verification operations', () => {
    it('should check if email is verified', () => {
      expect(profile.isEmailVerified()).toBe(true);
    });

    it('should set email verification status', () => {
      profile.setEmailVerified(false);
      expect(profile.isEmailVerified()).toBe(false);
    });

    it('should handle undefined email verification', () => {
      const emptyProfile = new UserProfile({});
      expect(emptyProfile.isEmailVerified()).toBeUndefined();
    });

    it('should toggle email verification status', () => {
      expect(profile.isEmailVerified()).toBe(true);

      profile.setEmailVerified(false);
      expect(profile.isEmailVerified()).toBe(false);

      profile.setEmailVerified(true);
      expect(profile.isEmailVerified()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null values in profile', () => {
      const profileWithNulls = new UserProfile({
        phone_number: undefined,
        da_email: undefined,
        permissions: undefined
      });

      expect(profileWithNulls.getPhoneNumber()).toBeUndefined();
      expect(profileWithNulls.getDaEmail()).toBeUndefined();
      expect(profileWithNulls.getPermissions()).toEqual([]);
    });

    it('should handle empty strings', () => {
      const profileWithEmptyStrings = new UserProfile({
        phone_number: '',
        da_email: '',
        certificate: ''
      });

      expect(profileWithEmptyStrings.getPhoneNumber()).toBe('');
      expect(profileWithEmptyStrings.getDaEmail()).toBe('');
      expect(profileWithEmptyStrings.getCertificate()).toBe('');
    });

    it('should handle empty permissions array', () => {
      const profileWithEmptyPermissions = new UserProfile({
        permissions: []
      });

      expect(profileWithEmptyPermissions.getPermissions()).toEqual([]);
      expect(profileWithEmptyPermissions.hasPermission('any')).toBe(false);
    });

    it('should handle permissions with undefined values', () => {
      const profileWithUndefinedValues = new UserProfile({
        permissions: [{ key: 'test', value: undefined }]
      });

      expect(profileWithUndefinedValues.hasPermission('test')).toBe(true);
      expect(profileWithUndefinedValues.getPermissionValues('test')).toBeUndefined();
    });

    it('should handle permissions with empty key', () => {
      profile.addPermission('', ['value']);
      expect(profile.hasPermission('')).toBe(true);
      expect(profile.getPermissionValues('')).toEqual(['value']);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete profile lifecycle', () => {
      // Create
      const newProfile = new UserProfile({});
      expect(newProfile.getProfile()).toEqual({});

      // Update
      newProfile.updateProfile({
        phone_number: '+1234567890',
        da_email: 'user@example.com'
      });
      expect(newProfile.getPhoneNumber()).toBe('+1234567890');

      // Add permissions
      newProfile.addPermission('perm1', ['val1']);
      expect(newProfile.hasPermission('perm1')).toBe(true);

      // Verify
      newProfile.setEmailVerified(true);
      expect(newProfile.isEmailVerified()).toBe(true);
    });

    it('should maintain data consistency across operations', () => {
      // Store original values before modifications
      const originalPhone = profile.getPhoneNumber();
      const originalEmail = profile.getDaEmail();

      // Multiple updates
      profile.setPhoneNumber('+9999999999');
      profile.setDaEmail('new@example.com');
      profile.addPermission('new_perm', ['val']);

      // Verify original values were different
      expect(originalPhone).toBe('+1234567890');
      expect(originalEmail).toBe('user@example.com');

      // Verify new data
      expect(profile.getPhoneNumber()).toBe('+9999999999');
      expect(profile.getDaEmail()).toBe('new@example.com');
      expect(profile.hasPermission('new_perm')).toBe(true);
    });

    it('should support profile cloning pattern', () => {
      const clonedData = { ...profile.getProfile() };
      const clonedProfile = new UserProfile(clonedData);

      expect(clonedProfile.getProfile()).toEqual(profile.getProfile());

      // Modify clone
      clonedProfile.setPhoneNumber('+9999999999');

      // Original should be unchanged
      expect(profile.getPhoneNumber()).toBe('+1234567890');
      expect(clonedProfile.getPhoneNumber()).toBe('+9999999999');
    });

    it('should support profile merging pattern', () => {
      const profile1 = new UserProfile({
        phone_number: '+1111111111',
        da_email: 'user1@example.com'
      });

      const profile2 = new UserProfile({
        certificate: 'cert456',
        email_verified: true
      });

      // Merge profiles
      const mergedData = {
        ...profile1.getProfile(),
        ...profile2.getProfile()
      };
      const mergedProfile = new UserProfile(mergedData);

      expect(mergedProfile.getPhoneNumber()).toBe('+1111111111');
      expect(mergedProfile.getDaEmail()).toBe('user1@example.com');
      expect(mergedProfile.getCertificate()).toBe('cert456');
      expect(mergedProfile.isEmailVerified()).toBe(true);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support S3 profile image URL pattern', () => {
      const s3Url =
        'https://s3.amazonaws.com/Brain-user-profile-images/user-123.jpg';
      profile.setProfileImageUrl(s3Url);

      expect(profile.hasProfileImage()).toBe(true);
      expect(profile.getProfileImageUrl()).toBe(s3Url);
    });

    it('should support permission-based access control', () => {
      const hasExecPoll = profile
        .getPermissionValues('restricted_resources')
        ?.includes('exec-poll');
      const hasLambda = profile
        .getPermissionValues('restricted_resources')
        ?.includes('lambda');

      expect(hasExecPoll).toBe(true);
      expect(hasLambda).toBe(true);
    });

    it('should support multiple permission keys', () => {
      profile.addPermission('feature_flags', ['flag1', 'flag2']);
      profile.addPermission('api_access', ['read', 'write']);

      expect(profile.hasPermission('feature_flags')).toBe(true);
      expect(profile.hasPermission('api_access')).toBe(true);
      expect(profile.getPermissions().length).toBeGreaterThanOrEqual(4);
    });

    it('should support email verification workflow', () => {
      const unverifiedProfile = new UserProfile({
        da_email: 'user@example.com',
        email_verified: false
      });

      expect(unverifiedProfile.isEmailVerified()).toBe(false);

      // Simulate verification
      unverifiedProfile.setEmailVerified(true);
      expect(unverifiedProfile.isEmailVerified()).toBe(true);
    });
  });
});

