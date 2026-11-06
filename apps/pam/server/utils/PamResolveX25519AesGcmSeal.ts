import {
  createCipheriv,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  type KeyObject
} from 'node:crypto';
import {
  PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1,
  type PamResolveSealClientOfferType,
  type PamResolveSealEnvelopeType,
  type PamResolveSealInterface
} from '@server/interfaces/PamResolveSealInterface';

const HKDF_INFO = Buffer.from('pam-resolve-seal-v1');
const NONCE_BYTES = 12;
const RAW_KEY_BYTES = 32;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Buffer {
  return Buffer.from(value, 'base64');
}

function exportRawX25519Public(key: KeyObject): Buffer {
  const jwk = key.export({ format: 'jwk' }) as { x?: string };
  if (!jwk.x) {
    throw new Error('X25519 public key missing jwk.x');
  }
  const raw = Buffer.from(jwk.x, 'base64url');
  if (raw.length !== RAW_KEY_BYTES) {
    throw new Error('X25519 public key must be 32 bytes');
  }
  return raw;
}

function importRawX25519Public(raw: Buffer): KeyObject {
  if (raw.length !== RAW_KEY_BYTES) {
    throw new Error('X25519 public key must be 32 bytes');
  }
  return createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: raw.toString('base64url')
    },
    format: 'jwk'
  });
}

/**
 * {@link PamResolveSealInterface} 的默认实现（X25519 + AES-GCM）。
 *
 * 兑现 resolve「响应体无明文」；可由 Registry 替换为其它算法。
 * 服务端临时密钥与客户端公钥 ECDH，再 HKDF → AES-256-GCM 加密 variables JSON。
 * 由 {@link PamResolveSealRegistry.createDefault} 注册；CLI 用同 alg 客户端 open。
 *
 * @see PamResolveSealInterface
 */
export class PamResolveX25519AesGcmSeal implements PamResolveSealInterface {
  public readonly alg = PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1;

  /**
   * @override
   */
  public seal(
    plaintext: Uint8Array,
    clientOffer: PamResolveSealClientOfferType
  ): PamResolveSealEnvelopeType {
    if (clientOffer.alg !== this.alg) {
      throw new Error(`Unsupported resolve seal alg: ${clientOffer.alg}`);
    }

    const clientPublic = importRawX25519Public(
      fromBase64(clientOffer.publicKey)
    );
    const { publicKey: serverPublic, privateKey: serverPrivate } =
      generateKeyPairSync('x25519');

    const shared = diffieHellman({
      privateKey: serverPrivate,
      publicKey: clientPublic
    });
    const aesKey = Buffer.from(
      hkdfSync('sha256', shared, Buffer.alloc(0), HKDF_INFO, RAW_KEY_BYTES)
    );
    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv('aes-256-gcm', aesKey, nonce);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(plaintext)),
      cipher.final()
    ]);
    const ciphertext = Buffer.concat([encrypted, cipher.getAuthTag()]);

    return {
      alg: this.alg,
      ephemeralPublicKey: toBase64(exportRawX25519Public(serverPublic)),
      nonce: toBase64(nonce),
      ciphertext: toBase64(ciphertext)
    };
  }
}
