/**
 * BrainUserStore test-suite
 *
 * Coverage:
 * 1. Constructor              - Store initialization with options
 * 2. getToken                 - Token retrieval from credentials
 * 3. getFeatureTags           - Feature tags handler access
 * 4. getUserProfile           - User profile handler access
 * 5. Inheritance              - UserStore methods availability
 * 6. State management         - User and credential state
 * 7. Type safety              - Generic type parameters
 * 8. Integration              - Working with FeatureTags and UserProfile
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BrainUserStore } from '../src/BrainUserStore';
import { createFeatureTags } from '../src/FeatureTags';
import { UserProfile } from '../src/UserProfile';
import type { BrainUser } from '../src/types/BrainUserTypes';
import type { BrainCredentials } from '../src/interface/BrainUserGatewayInterface';

describe('BrainUserStore', () => {
  const mockFeatureTags = createFeatureTags<readonly string[]>({
    featureTags: [],
    preFeatureTags: []
  });

  const mockUserProfile = new UserProfile({});

  describe('constructor', () => {
    it('should create store with required options', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should create store with storage options', () => {
      const store = new BrainUserStore({
        storage: null,
        storageKey: 'test_profile',
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should create store with persistence options', () => {
      const store = new BrainUserStore({
        persistUserInfo: true,
        credentialStorageKey: 'test_token',
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should store featureTags handler', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      expect(store.getFeatureTags()).toBe(mockFeatureTags);
    });

    it('should store userProfile handler', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      expect(store.getUserProfile()).toBe(mockUserProfile);
    });
  });

  describe('getToken', () => {
    it('should return empty string when no credential', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      expect(store.getToken()).toBe('');
    });

    it('should return token from credential', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      const credential: BrainCredentials = {
        token: 'test-token-123'
      };

      store.setCredential(credential);
      expect(store.getToken()).toBe('test-token-123');
    });

    it('should return empty string when credential has no token', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      store.setCredential({} as BrainCredentials);
      expect(store.getToken()).toBe('');
    });

    it('should update token when credential changes', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      store.setCredential({ token: 'token-1' });
      expect(store.getToken()).toBe('token-1');

      store.setCredential({ token: 'token-2' });
      expect(store.getToken()).toBe('token-2');
    });
  });

  describe('getFeatureTags', () => {
    it('should return feature tags handler', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      const tags = store.getFeatureTags();
      expect(tags).toBe(mockFeatureTags);
    });

    it('should return same instance on multiple calls', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      const tags1 = store.getFeatureTags();
      const tags2 = store.getFeatureTags();

      expect(tags1).toBe(tags2);
    });

    it('should work with custom feature tags', () => {
      const customTags = createFeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags: []
      });

      const store = new BrainUserStore({
        featureTags: customTags,
        userProfile: mockUserProfile
      });

      expect(store.getFeatureTags()).toBe(customTags);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile handler', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      const profile = store.getUserProfile();
      expect(profile).toBe(mockUserProfile);
    });

    it('should return same instance on multiple calls', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      const profile1 = store.getUserProfile();
      const profile2 = store.getUserProfile();

      expect(profile1).toBe(profile2);
    });

    it('should work with custom user profile', () => {
      const customProfile = new UserProfile({
        phone_number: '1234567890'
      });

      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: customProfile
      });

      expect(store.getUserProfile()).toBe(customProfile);
    });
  });

  describe('inherited UserStore methods', () => {
    let store: BrainUserStore<readonly string[]>;

    beforeEach(() => {
      store = new BrainUserStore<readonly string[]>({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });
    });

    it('should have setUser method', () => {
      expect(typeof store.setUser).toBe('function');
    });

    it('should have getState method', () => {
      expect(typeof store.getState).toBe('function');
    });

    it('should have setCredential method', () => {
      expect(typeof store.setCredential).toBe('function');
    });

    it('should have getCredential method', () => {
      expect(typeof store.getCredential).toBe('function');
    });

    it('should have reset method', () => {
      expect(typeof store.reset).toBe('function');
    });

    it('should set and get user', () => {
      const user: BrainUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        auth_token: { key: 'token' }
      };

      store.setUser(user);
      const state = store.getState();

      expect(state.result).toEqual(user);
    });

    it('should set and get credential', () => {
      const credential: BrainCredentials = {
        token: 'test-token'
      };

      store.setCredential(credential);
      const retrievedCredential = store.getCredential();

      expect(retrievedCredential).toEqual(credential);
    });

    it('should reset store state', () => {
      const user: BrainUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        auth_token: { key: 'token' }
      };
      const credential: BrainCredentials = {
        token: 'test-token'
      };

      store.setUser(user);
      store.setCredential(credential);

      store.reset();

      const state = store.getState();
      expect(state.result).toBeNull();
      expect(store.getCredential()).toBeNull();
      expect(store.getToken()).toBe('');
    });
  });

  describe('type safety', () => {
    it('should support generic type parameter', () => {
      const tags = ['disable_gen_UI', 'test'] as const;
      const customTags = createFeatureTags({
        featureTags: [],
        preFeatureTags: tags
      });

      const store = new BrainUserStore<typeof tags>({
        featureTags: customTags,
        userProfile: mockUserProfile
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should infer type from feature tags', () => {
      type Tags = readonly ['tag1', 'tag2'];
      const customTags = createFeatureTags<Tags>({
        featureTags: [],
        preFeatureTags: ['tag1', 'tag2'] as Tags
      });

      const store = new BrainUserStore<Tags>({
        featureTags: customTags,
        userProfile: mockUserProfile
      });

      expect(store.getFeatureTags()).toBe(customTags);
    });
  });

  describe('integration scenarios', () => {
    it('should work with FeatureTags integration', () => {
      const tags = ['disable_gen_UI'] as const;
      const featureTags = createFeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags: tags
      });

      const store = new BrainUserStore({
        featureTags,
        userProfile: mockUserProfile
      });

      const retrievedTags = store.getFeatureTags();
      expect(retrievedTags.getFeatureTags()).toContain('disable_gen_UI');
    });

    it('should work with UserProfile integration', () => {
      const profile = new UserProfile({
        phone_number: '1234567890',
        da_email: 'test@example.com'
      });

      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: profile
      });

      const retrievedProfile = store.getUserProfile();
      expect(retrievedProfile.getPhoneNumber()).toBe('1234567890');
      expect(retrievedProfile.getDaEmail()).toBe('test@example.com');
    });

    it('should maintain state across operations', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      const user: BrainUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        auth_token: { key: 'token' }
      };
      const credential: BrainCredentials = {
        token: 'test-token-123'
      };

      store.setUser(user);
      store.setCredential(credential);

      const state = store.getState();
      expect(state.result).toEqual(user);
      expect(store.getToken()).toBe('test-token-123');
      expect(store.getFeatureTags()).toBe(mockFeatureTags);
      expect(store.getUserProfile()).toBe(mockUserProfile);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support authentication flow', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      // Login
      const credential: BrainCredentials = {
        token: 'auth-token-xyz'
      };
      store.setCredential(credential);

      // Fetch user info
      const user: BrainUser = {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        auth_token: { key: 'token' }
      };
      store.setUser(user);

      // Verify state
      expect(store.getToken()).toBe('auth-token-xyz');
      const state = store.getState();
      expect(state.result?.email).toBe('user@example.com');
    });

    it('should support logout flow', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      // Login
      store.setCredential({ token: 'token' });
      store.setUser({
        id: 1,
        email: 'user@example.com',
        name: 'User',
        auth_token: { key: 'token' }
      });

      // Logout
      store.reset();

      // Verify cleared state
      expect(store.getToken()).toBe('');
      const state = store.getState();
      expect(state.result).toBeNull();
    });

    it('should support token refresh', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      store.setCredential({ token: 'old-token' });
      expect(store.getToken()).toBe('old-token');

      // Refresh token
      store.setCredential({ token: 'new-token' });
      expect(store.getToken()).toBe('new-token');
    });
  });

  describe('edge cases', () => {
    it('should handle null credential', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      store.setCredential(null as any);
      expect(store.getToken()).toBe('');
    });

    it('should handle undefined credential', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      store.setCredential(undefined as any);
      expect(store.getToken()).toBe('');
    });

    it('should handle empty token string', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      store.setCredential({ token: '' });
      expect(store.getToken()).toBe('');
    });

    it('should handle multiple resets', () => {
      const store = new BrainUserStore({
        featureTags: mockFeatureTags,
        userProfile: mockUserProfile
      });

      store.setCredential({ token: 'token' });
      store.reset();
      store.reset();
      store.reset();

      expect(store.getToken()).toBe('');
    });
  });
});

