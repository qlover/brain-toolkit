/**
 * typeGuard test-suite
 *
 * Coverage:
 * 1. isBrainUser - Accepts real-world BrainUser payload shape
 * 2. isBrainUser - Rejects invalid shapes (missing/wrong types)
 * 3. isBrainCredentials - Accepts token object
 * 4. isBrainCredentials - Rejects invalid shapes
 */

import { describe, it, expect } from 'vitest';
import { isBrainCredentials, isBrainUser } from '../src/utils/typeGuard';

describe('typeGuard', () => {
  describe('isBrainUser', () => {
    it('should accept real-world payload (structure only, redacted secrets)', () => {
      const payload = {
        id: 3495,
        email: 'renjie.qin@brain.im',
        name: 'qrj2',
        first_name: 'qrj2',
        middle_name: '',
        last_name: '',
        profile: {
          phone_number: '',
          da_email: '',
          da_email_password: '',
          certificate: '',
          permissions: [
            {
              key: 'restricted_resources',
              value: ['exec', 'secrets']
            },
            {
              key: 'ably_api_key',
              value: ['REDACTED_ABLEY_API_KEY']
            },
            {
              key: 'jira_auth_token',
              value: ['REDACTED_JIRA_AUTH_TOKEN']
            }
          ],
          profile_img_url:
            'https://s3.us-east-2.amazonaws.com/brain.io.dev/brain-user-system/profile/3495/img_1757296274885',
          amplitude_device_id: null,
          email_verified: true
        },
        auth_token: {
          key: 'REDACTED_AUTH_TOKEN_KEY'
        },
        is_guest: false,
        is_superuser: false,
        is_active: true,
        roles: ['admin', 'staff'],
        created_at: '2023-05-31T07:28:50.075697Z',
        referral_enabled: true,
        referrals: [],
        referred_by: null,
        is_live: null,
        promocode: null,
        tags: ['test'],
        feature_tags: ['disable_gen_UI'],
        is_supernatural: false,
        is_decentralized: false,
        account: null
      };

      expect(isBrainUser(payload)).toBe(true);
    });

    it('should reject non-object values', () => {
      expect(isBrainUser(null)).toBe(false);
      expect(isBrainUser(undefined)).toBe(false);
      expect(isBrainUser('not-an-object')).toBe(false);
      expect(isBrainUser(123)).toBe(false);
      expect(isBrainUser(true)).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(isBrainUser({})).toBe(false);
      expect(
        isBrainUser({
          id: 1,
          email: 'a@b.com',
          name: 'n'
          // missing auth_token
        })
      ).toBe(false);
      expect(
        isBrainUser({
          id: 1,
          email: 'a@b.com',
          auth_token: { key: 'x' }
          // missing name
        })
      ).toBe(false);
    });

    it('should reject wrong field types', () => {
      expect(
        isBrainUser({
          id: '3495',
          email: 'renjie.qin@brain.im',
          name: 'qrj2',
          auth_token: { key: 'x' }
        })
      ).toBe(false);

      expect(
        isBrainUser({
          id: 3495,
          email: 123,
          name: 'qrj2',
          auth_token: { key: 'x' }
        })
      ).toBe(false);

      expect(
        isBrainUser({
          id: 3495,
          email: 'renjie.qin@brain.im',
          name: 123,
          auth_token: { key: 'x' }
        })
      ).toBe(false);

      expect(
        isBrainUser({
          id: 3495,
          email: 'renjie.qin@brain.im',
          name: 'qrj2',
          auth_token: null
        })
      ).toBe(false);

      expect(
        isBrainUser({
          id: 3495,
          email: 'renjie.qin@brain.im',
          name: 'qrj2',
          auth_token: {}
        })
      ).toBe(false);

      expect(
        isBrainUser({
          id: 3495,
          email: 'renjie.qin@brain.im',
          name: 'qrj2',
          auth_token: { key: 123 }
        })
      ).toBe(false);
    });
  });

  describe('isBrainCredentials', () => {
    it('should accept token object', () => {
      expect(isBrainCredentials({ token: 't' })).toBe(true);
    });

    it('should reject invalid shapes', () => {
      expect(isBrainCredentials(null)).toBe(false);
      expect(isBrainCredentials(undefined)).toBe(false);
      expect(isBrainCredentials({})).toBe(false);
      expect(isBrainCredentials({ token: 123 })).toBe(false);
    });
  });
});
