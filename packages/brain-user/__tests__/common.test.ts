/**
 * common config test-suite
 *
 * Coverage:
 * 1. PredefindStorage        - Predefined storage type constants
 * 2. PredefindStorageType    - Storage type union
 * 3. BRAIN_DOMAINS         - API domain configuration
 * 4. Storage keys            - Credential and profile storage keys
 * 5. Default values          - Default configuration values
 * 6. defaultBrainUserOptions - Complete default options object
 * 7. Type safety             - Type constraints and inference
 * 8. Immutability            - Frozen objects
 */

import { describe, it, expect } from 'vitest';
import {
  PredefindStorage,
  BRAIN_DOMAINS,
  BRAIN_STORAGE_CREDENTIAL_KEY,
  BRAIN_STORAGE_PROFILE_KEY,
  defaultStorageType,
  defaultServiceName,
  defaultEnv,
  defaultBrainUserOptions,
  type PredefindStorageType
} from '../src/config/common';

describe('common config', () => {
  describe('PredefindStorage', () => {
    it('should have localStorage constant', () => {
      expect(PredefindStorage.localStorage).toBe('localStorage');
    });

    it('should have sessionStorage constant', () => {
      expect(PredefindStorage.sessionStorage).toBe('sessionStorage');
    });

    it('should have exactly 2 storage types', () => {
      const keys = Object.keys(PredefindStorage);
      expect(keys).toHaveLength(2);
    });

    it('should contain expected storage types', () => {
      const keys = Object.keys(PredefindStorage);
      expect(keys).toContain('localStorage');
      expect(keys).toContain('sessionStorage');
    });

    it('should have matching key-value pairs', () => {
      expect(PredefindStorage.localStorage).toBe('localStorage');
      expect(PredefindStorage.sessionStorage).toBe('sessionStorage');
    });
  });

  describe('PredefindStorageType', () => {
    it('should accept localStorage as valid type', () => {
      const storage: PredefindStorageType = 'localStorage';
      expect(storage).toBe('localStorage');
    });

    it('should accept sessionStorage as valid type', () => {
      const storage: PredefindStorageType = 'sessionStorage';
      expect(storage).toBe('sessionStorage');
    });

    it('should work with PredefindStorage values', () => {
      const storage1: PredefindStorageType = PredefindStorage.localStorage;
      const storage2: PredefindStorageType = PredefindStorage.sessionStorage;

      expect(storage1).toBe('localStorage');
      expect(storage2).toBe('sessionStorage');
    });
  });

  describe('BRAIN_DOMAINS', () => {
    it('should have development domain', () => {
      expect(BRAIN_DOMAINS.development).toBe(
        'https://brus-dev.api.brain.ai/v1.0/invoke/brain-user-system/method'
      );
    });

    it('should have production domain', () => {
      expect(BRAIN_DOMAINS.production).toBe(
        'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'
      );
    });

    it('should have exactly 2 domains', () => {
      const keys = Object.keys(BRAIN_DOMAINS);
      expect(keys).toHaveLength(2);
    });

    it('should contain expected environment keys', () => {
      const keys = Object.keys(BRAIN_DOMAINS);
      expect(keys).toContain('development');
      expect(keys).toContain('production');
    });

    it('should be frozen (immutable)', () => {
      expect(Object.isFrozen(BRAIN_DOMAINS)).toBe(true);
    });

    it('should not allow modifications', () => {
      expect(() => {
        (BRAIN_DOMAINS as any).test = 'https://test.com';
      }).toThrow();
    });

    it('should have valid HTTPS URLs', () => {
      expect(BRAIN_DOMAINS.development).toMatch(/^https:\/\//);
      expect(BRAIN_DOMAINS.production).toMatch(/^https:\/\//);
    });

    it('should have brain.ai domains', () => {
      expect(BRAIN_DOMAINS.development).toContain('brain.ai');
      expect(BRAIN_DOMAINS.production).toContain('brain.ai');
    });

    it('should have consistent API path structure', () => {
      const expectedPath = '/v1.0/invoke/brain-user-system/method';
      expect(BRAIN_DOMAINS.development).toContain(expectedPath);
      expect(BRAIN_DOMAINS.production).toContain(expectedPath);
    });
  });

  describe('storage keys', () => {
    it('should have credential storage key', () => {
      expect(BRAIN_STORAGE_CREDENTIAL_KEY).toBe('brain_token');
    });

    it('should have profile storage key', () => {
      expect(BRAIN_STORAGE_PROFILE_KEY).toBe('brain_profile');
    });

    it('should have different keys for credential and profile', () => {
      expect(BRAIN_STORAGE_CREDENTIAL_KEY).not.toBe(
        BRAIN_STORAGE_PROFILE_KEY
      );
    });

    it('should use Brain prefix', () => {
      expect(BRAIN_STORAGE_CREDENTIAL_KEY).toMatch(/^brain_/);
      expect(BRAIN_STORAGE_PROFILE_KEY).toMatch(/^brain_/);
    });
  });

  describe('default values', () => {
    it('should have default storage type', () => {
      expect(defaultStorageType).toBe('localStorage');
    });

    it('should have default service name', () => {
      expect(defaultServiceName).toBe('brainUserService');
    });

    it('should have default environment', () => {
      expect(defaultEnv).toBe('development');
    });

    it('should use localStorage as default storage', () => {
      expect(defaultStorageType).toBe(PredefindStorage.localStorage);
    });
  });

  describe('defaultBrainUserOptions', () => {
    it('should have env property', () => {
      expect(defaultBrainUserOptions.env).toBe('development');
    });

    it('should have domains property', () => {
      expect(defaultBrainUserOptions.domains).toBe(BRAIN_DOMAINS);
    });


    it('should have serviceName property', () => {
      expect(defaultBrainUserOptions.serviceName).toBe(
        'brainUserService'
      );
    });

    it('should have responseType property', () => {
      expect(defaultBrainUserOptions.responseType).toBe('json');
    });

    it('should have tokenPrefix property', () => {
      expect(defaultBrainUserOptions.tokenPrefix).toBe('token');
    });

    it('should have authKey property', () => {
      expect(defaultBrainUserOptions.authKey).toBe('Authorization');
    });

    it('should have requiredToken property', () => {
      expect(defaultBrainUserOptions.requiredToken).toBe(true);
    });

    it('should have all required properties', () => {
      expect(defaultBrainUserOptions).toHaveProperty('env');
      expect(defaultBrainUserOptions).toHaveProperty('domains');
      expect(defaultBrainUserOptions).toHaveProperty('serviceName');
      expect(defaultBrainUserOptions).toHaveProperty('responseType');
      expect(defaultBrainUserOptions).toHaveProperty('tokenPrefix');
      expect(defaultBrainUserOptions).toHaveProperty('authKey');
      expect(defaultBrainUserOptions).toHaveProperty('requiredToken');
    });

    it('should use default values consistently', () => {
      expect(defaultBrainUserOptions.env).toBe(defaultEnv);
      expect(defaultBrainUserOptions.domains).toBe(BRAIN_DOMAINS);
      expect(defaultBrainUserOptions.serviceName).toBe(defaultServiceName);
    });
  });

  describe('type safety', () => {
    it('should support PredefindStorageType union', () => {
      const validTypes: PredefindStorageType[] = [
        'localStorage',
        'sessionStorage'
      ];

      validTypes.forEach((type) => {
        expect(['localStorage', 'sessionStorage']).toContain(type);
      });
    });

    it('should infer storage type from PredefindStorage', () => {
      type StorageKeys = keyof typeof PredefindStorage;
      const keys: StorageKeys[] = ['localStorage', 'sessionStorage'];

      expect(keys).toHaveLength(2);
    });

    it('should support domain key types', () => {
      type DomainKeys = keyof typeof BRAIN_DOMAINS;
      const keys: DomainKeys[] = ['development', 'production'];

      expect(keys).toHaveLength(2);
    });
  });

  describe('integration scenarios', () => {
    it('should support environment-based domain selection', () => {
      const env: keyof typeof BRAIN_DOMAINS = 'development';
      const domain = BRAIN_DOMAINS[env];

      expect(domain).toBe(BRAIN_DOMAINS.development);
    });

    it('should support storage type selection', () => {
      const storageType: PredefindStorageType = PredefindStorage.localStorage;
      expect(storageType).toBe('localStorage');
    });

    it('should support options merging pattern', () => {
      const customOptions = {
        ...defaultBrainUserOptions,
        env: 'production' as const,
        serviceName: 'customService'
      };

      expect(customOptions.env).toBe('production');
      expect(customOptions.serviceName).toBe('customService');
      expect(customOptions.domains).toBe(BRAIN_DOMAINS);
    });

    it('should support partial options override', () => {
      const partialOptions = {
        env: defaultBrainUserOptions.env,
        domains: defaultBrainUserOptions.domains
      };

      expect(partialOptions.env).toBe('development');
      expect(partialOptions.domains).toBe(BRAIN_DOMAINS);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support multi-environment configuration', () => {
      const environments = ['development', 'production'] as const;

      environments.forEach((env) => {
        expect(BRAIN_DOMAINS[env]).toBeDefined();
        expect(BRAIN_DOMAINS[env]).toMatch(/^https:\/\//);
      });
    });

    it('should support storage key namespacing', () => {
      // Both keys should use Brain_ prefix to avoid conflicts
      expect(BRAIN_STORAGE_CREDENTIAL_KEY).toMatch(/^brain_/);
      expect(BRAIN_STORAGE_PROFILE_KEY).toMatch(/^brain_/);

      // Keys should be descriptive
      expect(BRAIN_STORAGE_CREDENTIAL_KEY).toContain('token');
      expect(BRAIN_STORAGE_PROFILE_KEY).toContain('profile');
    });

    it('should support default configuration pattern', () => {
      // Application can use defaults directly
      const config = {
        apiUrl: BRAIN_DOMAINS[defaultEnv],
        storage: defaultStorageType,
        tokenKey: BRAIN_STORAGE_CREDENTIAL_KEY
      };

      expect(config.apiUrl).toBe(BRAIN_DOMAINS.development);
      expect(config.storage).toBe('localStorage');
      expect(config.tokenKey).toBe('brain_token');
    });

    it('should support configuration factory pattern', () => {
      function createConfig(env: keyof typeof BRAIN_DOMAINS) {
        return {
          ...defaultBrainUserOptions,
          env,
          domains: BRAIN_DOMAINS
        };
      }

      const devConfig = createConfig('development');
      const prodConfig = createConfig('production');

      expect(devConfig.env).toBe('development');
      expect(prodConfig.env).toBe('production');
    });

    it('should support storage strategy selection', () => {
      function getStorage(persistent: boolean): PredefindStorageType {
        return persistent
          ? PredefindStorage.localStorage
          : PredefindStorage.sessionStorage;
      }

      expect(getStorage(true)).toBe('localStorage');
      expect(getStorage(false)).toBe('sessionStorage');
    });
  });

  describe('edge cases', () => {
    it('should handle domain object iteration', () => {
      const domains = Object.entries(BRAIN_DOMAINS);

      expect(domains).toHaveLength(2);
      domains.forEach(([_env, url]) => {
        expect(url).toMatch(/^https:\/\//);
      });
    });

    it('should handle storage type validation', () => {
      const validStorageTypes = Object.values(PredefindStorage);

      expect(validStorageTypes).toContain('localStorage');
      expect(validStorageTypes).toContain('sessionStorage');
      expect(validStorageTypes).toHaveLength(2);
    });

    it('should maintain reference equality for BRAIN_DOMAINS', () => {
      const ref1 = BRAIN_DOMAINS;
      const ref2 = BRAIN_DOMAINS;

      expect(ref1).toBe(ref2);
    });

    it('should not allow BRAIN_DOMAINS property deletion', () => {
      expect(() => {
        delete (BRAIN_DOMAINS as any).development;
      }).toThrow();
    });
  });

  describe('constants validation', () => {
    it('should have non-empty string constants', () => {
      expect(BRAIN_STORAGE_CREDENTIAL_KEY).toBeTruthy();
      expect(BRAIN_STORAGE_PROFILE_KEY).toBeTruthy();
      expect(defaultStorageType).toBeTruthy();
      expect(defaultServiceName).toBeTruthy();
      expect(defaultEnv).toBeTruthy();
    });

    it('should have valid domain URLs', () => {
      Object.values(BRAIN_DOMAINS).forEach((url) => {
        expect(url).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]+/);
      });
    });

    it('should have consistent naming conventions', () => {
      // Storage keys use snake_case with brain_ prefix
      expect(BRAIN_STORAGE_CREDENTIAL_KEY).toMatch(/^brain_[a-z_]+$/);
      expect(BRAIN_STORAGE_PROFILE_KEY).toMatch(/^brain_[a-z_]+$/);

      // Service name uses camelCase
      expect(defaultServiceName).toMatch(/^[a-z][a-zA-Z]*$/);
    });
  });
});

