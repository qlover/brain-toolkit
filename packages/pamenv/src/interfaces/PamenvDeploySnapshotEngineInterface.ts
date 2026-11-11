/**
 * 部署快照：构建时把变量打成 AES 密文；运行时用 DEK 本地解开。
 * 与 resolve 传输密封（X25519）无关，只负责文件层加解密。
 */

/** 单键密文条目（v2）。 */
export type PamenvDeploySnapshotEntryType = {
  readonly nonce: string;
  readonly ciphertext: string;
};

/** v1：整表一块密文（仅运行时降级读取）。 */
export type PamenvDeploySnapshotV1FileType = {
  readonly v: 1;
  readonly alg: 'aes256gcm-v1';
  readonly projectRef: string;
  readonly envName: string;
  readonly createdAt: string;
  readonly nonce: string;
  readonly ciphertext: string;
  readonly wrappedDek: string;
};

/** v2：每键独立 AES-GCM，可按 only/omit 只解密子集。 */
export type PamenvDeploySnapshotV2FileType = {
  readonly v: 2;
  readonly alg: 'aes256gcm-per-key-v1';
  readonly projectRef: string;
  readonly envName: string;
  readonly createdAt: string;
  readonly entries: Readonly<Record<string, PamenvDeploySnapshotEntryType>>;
  readonly wrappedDek: string;
};

export type PamenvDeploySnapshotFileType =
  | PamenvDeploySnapshotV1FileType
  | PamenvDeploySnapshotV2FileType;

/** 构建写出结果：按键密封 + 内存 DEK。 */
export type PamenvDeploySnapshotCreateResultType = {
  readonly entries: Readonly<Record<string, PamenvDeploySnapshotEntryType>>;
  /** 原始 32 字节 DEK，base64；仅内存使用，勿落盘。 */
  readonly dekBase64: string;
};

/**
 * 部署快照引擎契约。
 */
export interface PamenvDeploySnapshotEngineInterface {
  /**
   * 用随机 DEK 按键密封变量表（写出 v2）。
   *
   * @param variables - 键值明文（仅内存）
   */
  createFromVariables(
    variables: Readonly<Record<string, string>>
  ): PamenvDeploySnapshotCreateResultType;

  /**
   * 解开 v1 整包密文（旧产物降级）。
   *
   * @param snapshot - v1 快照字段
   * @param dekBase64 - unwrap 后得到的 DEK
   */
  openV1(
    snapshot: Pick<
      PamenvDeploySnapshotV1FileType,
      'nonce' | 'ciphertext' | 'alg'
    >,
    dekBase64: string
  ): Record<string, string>;

  /**
   * 按键解开 v2 快照中的指定 keys（缺失键跳过）。
   *
   * @param snapshot - v2 快照
   * @param dekBase64 - unwrap 后得到的 DEK
   * @param keys - 要解密的键名
   */
  openKeys(
    snapshot: Pick<PamenvDeploySnapshotV2FileType, 'alg' | 'entries'>,
    dekBase64: string,
    keys: readonly string[]
  ): Record<string, string>;
}
