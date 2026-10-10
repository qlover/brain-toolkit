import { describe, expect, it } from 'vitest';
import { toBusinessEmail } from '@shared/utils/pamUserIdentity';
import {
  toBrainIdentityData,
  toBrainProfile
} from '@server/utils/brainOAuthProfile';

const SUB = '11111111-1111-4111-8111-111111111111';

describe('toBrainProfile', () => {
  it('maps brain-oauth userinfo claims', () => {
    expect(
      toBrainProfile({
        sub: SUB,
        email: 'a@example.com',
        email_verified: true,
        name: 'Alice',
        phone_number: '138 0000 8000',
        brain_env: ' production '
      })
    ).toEqual({
      sub: SUB,
      email: 'a@example.com',
      emailVerified: true,
      name: 'Alice',
      phone: '+8613800008000',
      env: 'production'
    });
  });

  it('leaves env null when brain-oauth omits brain_env', () => {
    expect(toBrainProfile({ sub: SUB, email: 'a@example.com' }).env).toBeNull();
  });

  it('treats email / sub fallback names as missing', () => {
    expect(
      toBrainProfile({
        sub: SUB,
        email: 'a@example.com',
        name: 'a@example.com'
      }).name
    ).toBeNull();
    expect(toBrainProfile({ sub: SUB, email: '', name: SUB }).name).toBeNull();
  });

  it('never marks an empty email as verified', () => {
    const profile = toBrainProfile({
      sub: SUB,
      email: '',
      email_verified: true,
      phone_number: '+8613800008000'
    });
    expect(profile).toMatchObject({ email: '', emailVerified: false });
  });

  it('rejects userinfo without sub', () => {
    expect(() => toBrainProfile({ email: 'a@example.com' })).toThrow();
  });
});

describe('toBrainIdentityData', () => {
  it('keeps env and account, preferring email over name', () => {
    expect(
      toBrainIdentityData(
        toBrainProfile({
          sub: SUB,
          email: 'a@example.com',
          name: 'Alice',
          brain_env: 'production'
        })
      )
    ).toEqual({ env: 'production', account: 'a@example.com' });
  });

  it('omits missing values', () => {
    expect(
      toBrainIdentityData(toBrainProfile({ sub: SUB, email: '', name: SUB }))
    ).toEqual({});
  });
});

describe('toBusinessEmail', () => {
  it('drops Brain and phone placeholder emails', () => {
    expect(toBusinessEmail(`${SUB}@brain.oauth`)).toBeNull();
    expect(toBusinessEmail('8613800008000@phone.pam.local')).toBeNull();
    expect(toBusinessEmail(' a@example.com ')).toBe('a@example.com');
  });
});
