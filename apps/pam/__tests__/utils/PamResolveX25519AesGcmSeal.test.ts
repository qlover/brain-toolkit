import {
  createDecipheriv,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  type KeyObject
} from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1 } from '@server/interfaces/PamResolveSealInterface';
import { PamResolveSealRegistry } from '@server/utils/PamResolveSealRegistry';
import { PamResolveX25519AesGcmSeal } from '@server/utils/PamResolveX25519AesGcmSeal';

const HKDF_INFO = Buffer.from('pam-resolve-seal-v1');
const TAG_BYTES = 16;

function exportRawPublic(key: KeyObject): Buffer {
  const jwk = key.export({ format: 'jwk' }) as { x?: string };
  return Buffer.from(jwk.x!, 'base64url');
}

function openEnvelope(
  envelope: {
    alg: string;
    ephemeralPublicKey: string;
    nonce: string;
    ciphertext: string;
  },
  privateKey: KeyObject
): string {
  const serverPublic = createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: Buffer.from(envelope.ephemeralPublicKey, 'base64').toString(
        'base64url'
      )
    },
    format: 'jwk'
  });
  const shared = diffieHellman({ privateKey, publicKey: serverPublic });
  const aesKey = Buffer.from(
    hkdfSync('sha256', shared, Buffer.alloc(0), HKDF_INFO, 32)
  );
  const packed = Buffer.from(envelope.ciphertext, 'base64');
  const tag = packed.subarray(packed.length - TAG_BYTES);
  const encrypted = packed.subarray(0, packed.length - TAG_BYTES);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    aesKey,
    Buffer.from(envelope.nonce, 'base64')
  );
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8'
  );
}

describe('PamResolveX25519AesGcmSeal', () => {
  it('seals plaintext so the envelope has no secret substrings', () => {
    const { publicKey, privateKey } = generateKeyPairSync('x25519');
    const sealer = new PamResolveX25519AesGcmSeal();
    const secret = 'db-password-should-not-leak';
    const envelope = sealer.seal(
      Buffer.from(JSON.stringify([{ value: secret }])),
      {
        alg: PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1,
        publicKey: exportRawPublic(publicKey).toString('base64')
      }
    );

    expect(envelope.alg).toBe(PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1);
    expect(JSON.stringify(envelope)).not.toContain(secret);
    expect(JSON.parse(openEnvelope(envelope, privateKey))).toEqual([
      { value: secret }
    ]);
  });

  it('registry rejects unknown alg', () => {
    const registry = PamResolveSealRegistry.createDefault();
    const { publicKey } = generateKeyPairSync('x25519');
    expect(() =>
      registry.seal(Buffer.from('x'), {
        alg: 'unknown-alg',
        publicKey: exportRawPublic(publicKey).toString('base64')
      })
    ).toThrow(/Unsupported resolve seal alg/);
  });
});
