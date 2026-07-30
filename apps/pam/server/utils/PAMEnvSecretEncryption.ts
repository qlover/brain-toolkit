import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type BinaryLike,
  type CipherKey
} from 'crypto';
import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';
import type { EncryptorInterface } from '@qlover/fe-corekit/encrypt';

/** Prefix marking AES-GCM ciphertext stored in env variable values. */
export const PAM_ENV_SECRET_PREFIX = 'enc:v1:' as const;

function toUint8Array(data: Buffer): Uint8Array {
  return Uint8Array.from(data);
}

function concatUint8(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

/**
 * AES-256-GCM encryption for sensitive PAM environment variable values at rest.
 *
 * Significance: Keeps sensitive JSONB values encrypted in the database.
 * Core idea: Encrypt only `sensitive` values before persist; API still redacts on read.
 * Main function: Encrypt / decrypt strings and map variable arrays for storage.
 * Main purpose: Defends against database / backup disclosure of secrets.
 *
 * @example
 * const crypto = new PAMEnvSecretEncryption(process.env.PAM_ENV_SECRET_KEY!);
 * const stored = crypto.encryptSensitiveVariables(variables);
 */
export class PAMEnvSecretEncryption
  implements EncryptorInterface<string, string>
{
  private readonly key: CipherKey;

  /**
   * @param keyMaterial - Base64 key, optionally prefixed with `base64:`
   */
  constructor(keyMaterial: string) {
    const raw = keyMaterial.startsWith('base64:')
      ? keyMaterial.slice('base64:'.length)
      : keyMaterial;
    const keyBytes = toUint8Array(Buffer.from(raw, 'base64'));
    if (keyBytes.length !== 32) {
      throw new Error('PAM_ENV_SECRET_KEY must decode to 32 bytes (AES-256)');
    }
    this.key = keyBytes as CipherKey;
  }

  /**
   * Whether a stored value is already ciphertext produced by this class.
   *
   * @param value - Variable value from request or DB
   * @returns True when the value uses {@link PAM_ENV_SECRET_PREFIX}
   */
  public isEncrypted(value: string): boolean {
    return value.startsWith(PAM_ENV_SECRET_PREFIX);
  }

  /**
   * @override
   */
  public encrypt(plaintext: string): string {
    const iv = toUint8Array(randomBytes(12));
    const cipher = createCipheriv('aes-256-gcm', this.key, iv as BinaryLike);
    const encrypted = concatUint8(
      toUint8Array(cipher.update(plaintext, 'utf8')),
      toUint8Array(cipher.final())
    );
    const tag = toUint8Array(cipher.getAuthTag());
    return `${PAM_ENV_SECRET_PREFIX}${toBase64(iv)}:${toBase64(encrypted)}:${toBase64(tag)}`;
  }

  /**
   * @override
   */
  public decrypt(ciphertext: string): string {
    if (!this.isEncrypted(ciphertext)) {
      throw new Error('Invalid PAM env secret ciphertext prefix');
    }
    const payload = ciphertext.slice(PAM_ENV_SECRET_PREFIX.length);
    const [ivB64, dataB64, tagB64] = payload.split(':');
    if (!ivB64 || !dataB64 || !tagB64) {
      throw new Error('Invalid PAM env secret ciphertext format');
    }
    const iv = toUint8Array(Buffer.from(ivB64, 'base64'));
    const data = toUint8Array(Buffer.from(dataB64, 'base64'));
    const tag = toUint8Array(Buffer.from(tagB64, 'base64'));
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      iv as BinaryLike
    );
    decipher.setAuthTag(tag as NodeJS.ArrayBufferView);
    return Buffer.from(
      concatUint8(
        toUint8Array(decipher.update(data)),
        toUint8Array(decipher.final())
      )
    ).toString('utf8');
  }

  /**
   * Encrypts sensitive plaintext values for persistence.
   * Already-encrypted values and non-sensitive values are left unchanged.
   *
   * @param variables - Variables after merge / validation
   * @returns Variables safe to write into JSONB
   */
  public encryptSensitiveVariables(variables: PAMVariable[]): PAMVariable[] {
    return variables.map((variable: PAMVariable): PAMVariable => {
      if (!variable.sensitive) {
        return variable;
      }
      const value = variable.value;
      if (value.trim() === '' || this.isEncrypted(value)) {
        return variable;
      }
      return {
        ...variable,
        value: this.encrypt(value)
      };
    });
  }
}
