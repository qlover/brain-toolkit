/**
 * 默认 resolve 密封算法 id：X25519 + HKDF + AES-256-GCM。
 * 出现在请求 `seal.alg` / 响应 `seal.alg`。
 */
export const PAM_RESOLVE_SEAL_ALG_X25519_AES256GCM_V1 =
  'x25519-aes256gcm-v1' as const;

/**
 * 客户端一次性公钥，放在 `POST .../resolve` 的 `seal` 字段。
 */
export type PamResolveSealClientOfferType = {
  readonly alg: string;
  /** 原始 X25519 公钥，标准 base64。 */
  readonly publicKey: string;
};

/**
 * 密封后的变量载荷（替代明文 `variables`）。
 */
export type PamResolveSealEnvelopeType = {
  readonly alg: string;
  /** 服务端临时 X25519 公钥，标准 base64。 */
  readonly ephemeralPublicKey: string;
  /** AES-GCM IV，标准 base64。 */
  readonly nonce: string;
  /** 密文 || 16 字节 tag，标准 base64。 */
  readonly ciphertext: string;
};

/**
 * resolve 响应的应用层密封契约。
 *
 * 避免解密后的明文出现在 API JSON / 抓包里。
 * 请求带临时公钥，响应只含 seal；换算法实现本接口并注册即可。
 * 混合加密：客户端持私钥，服务端只见公钥，用 `alg` 区分实现。
 *
 * @example
 * const sealed = sealer.seal(jsonBytes, { alg, publicKey });
 */
export interface PamResolveSealInterface {
  /** 本实现对应的算法 id。 */
  readonly alg: string;

  /**
   * 将明文封给客户端临时公钥。
   *
   * @param plaintext - UTF-8 字节（一般为 variables[] 的 JSON）
   * @param clientOffer - 请求里的 alg + 公钥
   */
  seal(
    plaintext: Uint8Array,
    clientOffer: PamResolveSealClientOfferType
  ): PamResolveSealEnvelopeType;
}
