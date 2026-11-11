import {
  createCipheriv,
  randomBytes,
  type BinaryLike,
  type CipherKey
} from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  PAMENV_DEPLOY_SNAPSHOT_ALG,
  PAMENV_DEPLOY_SNAPSHOT_ALG_V1,
  PamenvDeploySnapshotEngine
} from '../src/impls/PamenvDeploySnapshotEngine';

describe('PamenvDeploySnapshotEngine', () => {
  it('v2 round-trips and can open a single key without exposing others in result', () => {
    const engine = new PamenvDeploySnapshotEngine();
    const secret = 'SITE_URL_VALUE_SHOULD_NOT_LEAK';
    const created = engine.createFromVariables({
      SITE_URL: secret,
      SESSION_SECRET: 'sess',
      APP_ENV: 'production'
    });

    const siteCipher = created.entries.SITE_URL?.ciphertext ?? '';
    expect(siteCipher).not.toContain(secret);
    expect(Object.keys(created.entries).sort()).toEqual([
      'APP_ENV',
      'SESSION_SECRET',
      'SITE_URL'
    ]);

    const opened = engine.openKeys(
      {
        alg: PAMENV_DEPLOY_SNAPSHOT_ALG,
        entries: created.entries
      },
      created.dekBase64,
      ['SESSION_SECRET']
    );

    expect(opened).toEqual({ SESSION_SECRET: 'sess' });
    expect(opened.SITE_URL).toBeUndefined();
  });

  it('rejects wrong DEK on v2 openKeys', () => {
    const engine = new PamenvDeploySnapshotEngine();
    const created = engine.createFromVariables({ FOO: 'bar' });
    const other = engine.createFromVariables({ FOO: 'baz' });
    expect(() =>
      engine.openKeys(
        {
          alg: PAMENV_DEPLOY_SNAPSHOT_ALG,
          entries: created.entries
        },
        other.dekBase64,
        ['FOO']
      )
    ).toThrow();
  });

  it('openV1 still round-trips legacy whole-blob snapshots', () => {
    const engine = new PamenvDeploySnapshotEngine();
    const dek = randomBytes(32);
    const nonce = randomBytes(12);
    const plaintext = Buffer.from(
      JSON.stringify({ SITE_URL: 'https://example.test', APP_ENV: 'dev' }),
      'utf8'
    );
    const cipher = createCipheriv(
      'aes-256-gcm',
      dek as CipherKey,
      nonce as BinaryLike
    );
    const packed = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
      cipher.getAuthTag()
    ]);

    const opened = engine.openV1(
      {
        alg: PAMENV_DEPLOY_SNAPSHOT_ALG_V1,
        nonce: nonce.toString('base64'),
        ciphertext: packed.toString('base64')
      },
      dek.toString('base64')
    );

    expect(opened.SITE_URL).toBe('https://example.test');
    expect(opened.APP_ENV).toBe('dev');
  });
});
