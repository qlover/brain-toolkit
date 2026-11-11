import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type BinaryLike,
  type CipherKey
} from 'node:crypto';
import type {
  PamenvDeploySnapshotCreateResultType,
  PamenvDeploySnapshotEngineInterface,
  PamenvDeploySnapshotEntryType,
  PamenvDeploySnapshotV1FileType,
  PamenvDeploySnapshotV2FileType
} from '../interfaces/PamenvDeploySnapshotEngineInterface';

const ALG_V1 = 'aes256gcm-v1' as const;
const ALG_V2 = 'aes256gcm-per-key-v1' as const;
const NONCE_BYTES = 12;
const DEK_BYTES = 32;
const TAG_BYTES = 16;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Buffer {
  return Buffer.from(value, 'base64');
}

function assertDek(dekBase64: string): Buffer {
  const dek = fromBase64(dekBase64);
  if (dek.length !== DEK_BYTES) {
    throw new Error('Deploy snapshot DEK must be 32 bytes');
  }
  return dek;
}

function sealUtf8(dek: Buffer, plaintext: string): PamenvDeploySnapshotEntryType {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(
    'aes-256-gcm',
    dek as CipherKey,
    nonce as BinaryLike
  );
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, 'utf8')),
    cipher.final(),
    cipher.getAuthTag()
  ]);
  return {
    nonce: toBase64(nonce),
    ciphertext: toBase64(encrypted)
  };
}

function openUtf8(
  dek: Buffer,
  entry: PamenvDeploySnapshotEntryType
): string {
  const nonce = fromBase64(entry.nonce);
  const packed = fromBase64(entry.ciphertext);
  if (packed.length <= TAG_BYTES) {
    throw new Error('Deploy snapshot ciphertext too short');
  }
  const data = packed.subarray(0, packed.length - TAG_BYTES);
  const tag = packed.subarray(packed.length - TAG_BYTES);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    dek as CipherKey,
    nonce as BinaryLike
  );
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8'
  );
}

/**
 * {@link PamenvDeploySnapshotEngineInterface} 默认实现（AES-256-GCM）。
 * 构建写出 v2 按键密封；运行可按 keys 只解密子集；仍可读 v1 整包。
 */
export class PamenvDeploySnapshotEngine
  implements PamenvDeploySnapshotEngineInterface
{
  /**
   * @override
   */
  public createFromVariables(
    variables: Readonly<Record<string, string>>
  ): PamenvDeploySnapshotCreateResultType {
    const dek = randomBytes(DEK_BYTES);
    const entries: Record<string, PamenvDeploySnapshotEntryType> = {};
    for (const [key, value] of Object.entries(variables)) {
      entries[key] = sealUtf8(dek, value);
    }
    return {
      entries,
      dekBase64: toBase64(dek)
    };
  }

  /**
   * @override
   */
  public openV1(
    snapshot: Pick<
      PamenvDeploySnapshotV1FileType,
      'nonce' | 'ciphertext' | 'alg'
    >,
    dekBase64: string
  ): Record<string, string> {
    if (snapshot.alg !== ALG_V1) {
      throw new Error(`Unsupported deploy snapshot alg: ${snapshot.alg}`);
    }
    const dek = assertDek(dekBase64);
    const plaintext = openUtf8(dek, {
      nonce: snapshot.nonce,
      ciphertext: snapshot.ciphertext
    });
    const parsed = JSON.parse(plaintext) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Deploy snapshot payload must be a string map');
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      if (typeof value === 'string') {
        out[key] = value;
      }
    }
    return out;
  }

  /**
   * @override
   */
  public openKeys(
    snapshot: Pick<PamenvDeploySnapshotV2FileType, 'alg' | 'entries'>,
    dekBase64: string,
    keys: readonly string[]
  ): Record<string, string> {
    if (snapshot.alg !== ALG_V2) {
      throw new Error(`Unsupported deploy snapshot alg: ${snapshot.alg}`);
    }
    const dek = assertDek(dekBase64);
    const out: Record<string, string> = {};
    for (const key of keys) {
      const entry = snapshot.entries[key];
      if (!entry) {
        continue;
      }
      out[key] = openUtf8(dek, entry);
    }
    return out;
  }
}

/** 构建写出使用的算法标识。 */
export const PAMENV_DEPLOY_SNAPSHOT_ALG = ALG_V2;
/** 旧产物整包算法（仅降级读取）。 */
export const PAMENV_DEPLOY_SNAPSHOT_ALG_V1 = ALG_V1;
