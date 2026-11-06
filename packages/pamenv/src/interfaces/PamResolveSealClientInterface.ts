/**
 * 须与服务端 `PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1` 一致。
 */
export const PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1 =
  'x25519-aes256gcm-v1' as const;

/**
 * 附在 `POST .../resolve` 请求体 `seal` 上的客户端 offer。
 */
export type PamResolveSealClientOfferType = {
  readonly alg: string;
  /** 原始 X25519 公钥，标准 base64。 */
  readonly publicKey: string;
};

/**
 * resolve 响应中的密封变量载荷。
 */
export type PamResolveSealEnvelopeType = {
  readonly alg: string;
  readonly ephemeralPublicKey: string;
  readonly nonce: string;
  readonly ciphertext: string;
};

/**
 * 单次 resolve 用的临时密钥材料。
 */
export type PamResolveSealEphemeralKeyPairType = {
  readonly offer: PamResolveSealClientOfferType;
  /** 不透明私钥句柄，仅回传给 {@link PamResolveSealClientInterface.open}。 */
  readonly privateKey: unknown;
};

/**
 * CLI 侧密封协议：生成临时密钥并解开信封。
 *
 * 把加解密从 ApiClient 拆出，换算法只换实现类。
 * 每次 resolve：createEphemeralKeyPair → 请求带 offer → open 响应 seal。
 * 与服务端同 alg 的混合加密；客户端持临时私钥。
 */
export interface PamResolveSealClientInterface {
  readonly alg: string;

  /**
   * @returns 是否能解开该 `alg` 的信封
   */
  supports(alg: string): boolean;

  /** 为下一次 resolve 生成一次性密钥对。 */
  createEphemeralKeyPair(): PamResolveSealEphemeralKeyPairType;

  /**
   * 用对应私钥解开密封信封。
   *
   * @param envelope - 响应里的 `seal`
   * @param privateKey - {@link createEphemeralKeyPair} 返回的句柄
   */
  open(
    envelope: PamResolveSealEnvelopeType,
    privateKey: unknown
  ): Uint8Array;
}
