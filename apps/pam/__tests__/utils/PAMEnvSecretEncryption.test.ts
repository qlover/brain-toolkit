import { describe, expect, it } from 'vitest';
import {
  PAM_ENV_SECRET_PREFIX,
  PAMEnvSecretEncryption
} from '@server/utils/PAMEnvSecretEncryption';

const TEST_KEY = 'base64:ZrNkJ4d7VfrLZPP0/ksjINC5XIRKmrIr1bPd+l+Wi7o=';

describe('PAMEnvSecretEncryption', () => {
  const encryption = new PAMEnvSecretEncryption(TEST_KEY);

  it('encrypts and decrypts plaintext', () => {
    const ciphertext = encryption.encrypt('super-secret');
    expect(ciphertext.startsWith(PAM_ENV_SECRET_PREFIX)).toBe(true);
    expect(encryption.decrypt(ciphertext)).toBe('super-secret');
  });

  it('encrypts only sensitive plaintext values', () => {
    const existingCipher = encryption.encrypt('kept');
    const result = encryption.encryptSensitiveVariables([
      { key: 'PLAIN', value: 'visible', sensitive: false },
      { key: 'NEW_SECRET', value: 'fresh', sensitive: true },
      { key: 'OLD_SECRET', value: existingCipher, sensitive: true }
    ]);

    expect(result[0]).toEqual({
      key: 'PLAIN',
      value: 'visible',
      sensitive: false
    });
    expect(result[1]?.sensitive).toBe(true);
    expect(result[1]?.value.startsWith(PAM_ENV_SECRET_PREFIX)).toBe(true);
    expect(encryption.decrypt(result[1]!.value)).toBe('fresh');
    expect(result[2]?.value).toBe(existingCipher);
  });

  it('decrypts sensitive ciphertext values for export', () => {
    const encrypted = encryption.encryptSensitiveVariables([
      { key: 'PLAIN', value: 'visible', sensitive: false },
      { key: 'SECRET', value: 'hidden', sensitive: true }
    ]);
    const decrypted = encryption.decryptSensitiveVariables(encrypted);
    expect(decrypted[0]?.value).toBe('visible');
    expect(decrypted[1]?.value).toBe('hidden');
  });
});
