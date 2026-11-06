import {
  createCipheriv,
  createDecipheriv,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  type KeyObject
} from 'node:crypto';
import {
  PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1,
  type PamResolveSealClientInterface,
  type PamResolveSealClientOfferType,
  type PamResolveSealEnvelopeType,
  type PamResolveSealEphemeralKeyPairType
} from '../interfaces/PamResolveSealClientInterface';

const HKDF_INFO = Buffer.from('pam-resolve-seal-v1');
const NONCE_BYTES = 12;
const RAW_KEY_BYTES = 32;
const TAG_BYTES = 16;

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

type PrivateHandleType = {
  readonly privateKey: KeyObject;
};

/**
 * {@link PamResolveSealClientInterface} 的默认实现（对齐服务端 X25519 密封）。
 *
 * 在 CLI 内存解开 resolve 信封，避免 ApiClient 绑死算法。
 * 与服务端相同：X25519 ECDH → HKDF-SHA256 → AES-256-GCM。
 * 生产只走 createEphemeralKeyPair / open；`seal` 仅供 mock 与单测。
 */
export class PamResolveX25519AesGcmSealClient
  implements PamResolveSealClientInterface
{
  public readonly alg = PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1;

  /**
   * @override
   */
  public supports(alg: string): boolean {
    return alg === this.alg;
  }

  /**
   * @override
   */
  public createEphemeralKeyPair(): PamResolveSealEphemeralKeyPairType {
    const { publicKey, privateKey } = generateKeyPairSync('x25519');
    return {
      offer: {
        alg: this.alg,
        publicKey: toBase64(exportRawX25519Public(publicKey))
      },
      privateKey: { privateKey } satisfies PrivateHandleType
    };
  }

  /**
   * 将明文封给客户端 offer（算法与 PAM 服务端一致）。
   * 供契约 mock 与往返测试；生产 CLI 只调用 open。
   *
   * @param plaintext - UTF-8 载荷
   * @param clientOffer - 客户端临时公钥
   */
  public seal(
    plaintext: Uint8Array,
    clientOffer: PamResolveSealClientOfferType
  ): PamResolveSealEnvelopeType {
    if (clientOffer.alg !== this.alg) {
      throw new Error(`Unsupported resolve seal alg: ${clientOffer.alg}`);
    }
    const clientPublic = importRawX25519Public(fromBase64(clientOffer.publicKey));
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
    return {
      alg: this.alg,
      ephemeralPublicKey: toBase64(exportRawX25519Public(serverPublic)),
      nonce: toBase64(nonce),
      ciphertext: toBase64(Buffer.concat([encrypted, cipher.getAuthTag()]))
    };
  }

  /**
   * @override
   */
  public open(
    envelope: PamResolveSealEnvelopeType,
    privateKey: unknown
  ): Uint8Array {
    if (!this.supports(envelope.alg)) {
      throw new Error(`Unsupported resolve seal alg: ${envelope.alg}`);
    }
    const handle = privateKey as PrivateHandleType;
    if (!handle?.privateKey) {
      throw new Error('Invalid resolve seal private key handle');
    }

    const serverPublic = importRawX25519Public(
      fromBase64(envelope.ephemeralPublicKey)
    );
    const shared = diffieHellman({
      privateKey: handle.privateKey,
      publicKey: serverPublic
    });
    const aesKey = Buffer.from(
      hkdfSync('sha256', shared, Buffer.alloc(0), HKDF_INFO, RAW_KEY_BYTES)
    );
    const nonce = fromBase64(envelope.nonce);
    const packed = fromBase64(envelope.ciphertext);
    if (packed.length <= TAG_BYTES) {
      throw new Error('Resolve seal ciphertext too short');
    }
    const tag = packed.subarray(packed.length - TAG_BYTES);
    const encrypted = packed.subarray(0, packed.length - TAG_BYTES);
    const decipher = createDecipheriv('aes-256-gcm', aesKey, nonce);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}
