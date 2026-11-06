import type {
  PamResolveSealClientOfferType,
  PamResolveSealEnvelopeType,
  PamResolveSealInterface
} from '@server/interfaces/PamResolveSealInterface';
import { PamResolveX25519AesGcmSeal } from '@server/utils/PamResolveX25519AesGcmSeal';

/**
 * 按 `alg` 选择 resolve 密封实现。
 *
 * 让 PAMService 不绑死具体加密类；换算法只注册新实现。
 * `createDefault()` 带上 X25519，或 `register` 后按请求 `seal.alg` 调用 `seal`。
 * 本质是 alg → {@link PamResolveSealInterface} 的映射表。
 */
export class PamResolveSealRegistry {
  protected readonly byAlg = new Map<string, PamResolveSealInterface>();

  constructor(sealers: readonly PamResolveSealInterface[] = []) {
    for (const sealer of sealers) {
      this.register(sealer);
    }
  }

  /** 带默认 X25519 AES-GCM 实现的注册表。 */
  public static createDefault(): PamResolveSealRegistry {
    return new PamResolveSealRegistry([new PamResolveX25519AesGcmSeal()]);
  }

  /**
   * @param sealer - 要注册的实现（同 alg 则覆盖）
   */
  public register(sealer: PamResolveSealInterface): void {
    this.byAlg.set(sealer.alg, sealer);
  }

  /**
   * @param alg - 客户端 offer 中的算法 id
   */
  public get(alg: string): PamResolveSealInterface | undefined {
    return this.byAlg.get(alg);
  }

  /**
   * 用 `clientOffer.alg` 对应的实现密封明文。
   *
   * @param plaintext - UTF-8 载荷
   * @param clientOffer - 客户端 alg + 公钥
   * @throws Error 未知 alg 时
   */
  public seal(
    plaintext: Uint8Array,
    clientOffer: PamResolveSealClientOfferType
  ): PamResolveSealEnvelopeType {
    const sealer = this.get(clientOffer.alg);
    if (!sealer) {
      throw new Error(`Unsupported resolve seal alg: ${clientOffer.alg}`);
    }
    return sealer.seal(plaintext, clientOffer);
  }
}
