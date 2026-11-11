import { describe, expect, it } from 'vitest';
import { CI_USER_EMAIL_DOMAIN } from '@shared/utils/pamUserIdentity';

describe('CI_USER_EMAIL_DOMAIN', () => {
  it('keeps create-time domain convention', () => {
    expect(CI_USER_EMAIL_DOMAIN).toBe('pam.ci.invalid');
  });
});
