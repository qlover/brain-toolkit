import { describe, expect, it } from 'vitest';
import { PamResolveSealClientRegistry } from '../src/impls/PamResolveSealClientRegistry';
import { PamResolveX25519AesGcmSealClient } from '../src/impls/PamResolveX25519AesGcmSealClient';
import { PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1 } from '../src/interfaces/PamResolveSealClientInterface';

describe('PamResolveX25519AesGcmSealClient', () => {
  it('round-trips variables without leaving plaintext in the envelope', () => {
    const client = new PamResolveX25519AesGcmSealClient();
    const ephemeral = client.createEphemeralKeyPair();
    const variables = [
      { key: 'API_URL', value: 'https://x.dev', sensitive: false },
      { key: 'SECRET', value: 'super-secret-value', sensitive: true }
    ];
    const plaintext = Buffer.from(JSON.stringify(variables), 'utf8');
    const envelope = client.seal(plaintext, ephemeral.offer);

    expect(envelope.alg).toBe(PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1);
    expect(JSON.stringify(envelope)).not.toContain('super-secret-value');
    expect(JSON.stringify(envelope)).not.toContain('https://x.dev');

    const opened = client.open(envelope, ephemeral.privateKey);
    expect(JSON.parse(Buffer.from(opened).toString('utf8'))).toEqual(variables);
  });

  it('registry prefers the default client and opens by alg', () => {
    const registry = PamResolveSealClientRegistry.createDefault();
    const ephemeral = registry.createEphemeralKeyPair();
    const sealer = new PamResolveX25519AesGcmSealClient();
    const envelope = sealer.seal(
      Buffer.from(JSON.stringify([{ key: 'K', value: 'v', sensitive: true }])),
      ephemeral.offer
    );
    const opened = registry.open(envelope, ephemeral.privateKey);
    expect(JSON.parse(Buffer.from(opened).toString('utf8'))).toEqual([
      { key: 'K', value: 'v', sensitive: true }
    ]);
  });
});
