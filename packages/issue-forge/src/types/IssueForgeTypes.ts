/**
 * 创建 Issue 的归一入参（平台标签语义由实现消化）。
 */
export type ForgeIssueCreateInputType = {
  readonly title: string;
  readonly body: string;
  /** 如 `feedback`、`type:bug`；目标平台无标签时实现可忽略或降级重试 */
  readonly labels: readonly string[];
};

/**
 * 创建成功后的归一结果。
 */
export type ForgeIssueCreatedType = {
  readonly issueNumber: number;
  readonly issueUrl: string;
  /** 平台侧稳定 id（如 GitHub node_id），可选 */
  readonly resourceKey?: string;
};

/**
 * 评论 / 附件所指向的 Issue 引用。
 */
export type ForgeIssueRefType = {
  readonly issueNumber: number;
  readonly resourceKey?: string;
};

/**
 * 可选资源上传（截图等）；不能上传的平台可不实现 `uploadAsset`。
 */
export type ForgeAssetUploadInputType = {
  readonly path: string;
  readonly contentBase64: string;
  readonly message?: string;
  /** 实现可解释为分支名等；GitHub 用独立 assets 分支 */
  readonly branch?: string;
};

export type ForgeAssetUploadedType = {
  /** Issue 可引用的展示 / raw URL */
  readonly url: string;
};

/**
 * GitHub App 专用鉴权；其它平台另建 `*AuthConfigType`，不进通用 Interface。
 */
export type GithubAppAuthConfigType = {
  readonly appId: string;
  readonly installationId: string;
  readonly privateKey: string;
  readonly owner: string;
  readonly repo: string;
};

/**
 * installation token 缓存（应用注入 MemoryKv / Redis 等）。
 */
export interface IssueForgeTokenCacheInterface {
  getItem<T>(key: string): Promise<T | null | undefined>;
  setItem<T>(
    key: string,
    value: T,
    options?: { readonly ttlMs?: number }
  ): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}

export type IssueWebhookVerifyResultType =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };
