import type {
  PamResolveSealClientInterface,
  PamResolveSealEnvelopeType,
  PamResolveSealEphemeralKeyPairType
} from '../interfaces/PamResolveSealClientInterface';
import { PamResolveX25519AesGcmSealClient } from './PamResolveX25519AesGcmSealClient';

/**
 * 按算法 id 选择 CLI 密封客户端。
 *
 * ApiClient 依赖注册表而非具体 sealer，换算法不必改 resolve 调用链。
 * `createDefault()` 后 createEphemeralKeyPair / open；多实现时按 envelope.alg 选型。
 * 有序列表 + 首选发 offer；open 时按 supports(alg) 查找。
 */
export class PamResolveSealClientRegistry {
  protected readonly clients: PamResolveSealClientInterface[];
  protected readonly preferred: PamResolveSealClientInterface;

  constructor(clients: readonly PamResolveSealClientInterface[]) {
    if (clients.length === 0) {
      throw new Error('PamResolveSealClientRegistry requires at least one client');
    }
    this.clients = [...clients];
    this.preferred = clients[0]!;
  }

  /** 默认注册表（优先 X25519 AES-GCM）。 */
  public static createDefault(): PamResolveSealClientRegistry {
    return new PamResolveSealClientRegistry([
      new PamResolveX25519AesGcmSealClient()
    ]);
  }

  /** 用首选客户端生成临时密钥对。 */
  public createEphemeralKeyPair(): PamResolveSealEphemeralKeyPairType {
    return this.preferred.createEphemeralKeyPair();
  }

  /**
   * 用支持 `envelope.alg` 的客户端解开信封。
   *
   * @param envelope - 响应中的 seal
   * @param privateKey - createEphemeralKeyPair 返回的私钥句柄
   */
  public open(
    envelope: PamResolveSealEnvelopeType,
    privateKey: unknown
  ): Uint8Array {
    const client = this.clients.find((item) => item.supports(envelope.alg));
    if (!client) {
      throw new Error(`Unsupported resolve seal alg: ${envelope.alg}`);
    }
    return client.open(envelope, privateKey);
  }
}
