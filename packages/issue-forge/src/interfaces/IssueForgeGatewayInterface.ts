import type {
  ForgeAssetUploadedType,
  ForgeAssetUploadInputType,
  ForgeIssueCreatedType,
  ForgeIssueCreateInputType,
  ForgeIssueRefType
} from '../types/IssueForgeTypes';

/**
 * Forge 无关的 Issue 网关（形态 B：实例已绑定鉴权 / 目标仓，方法不再传 config）。
 */
export interface IssueForgeGatewayInterface {
  createIssue(
    input: ForgeIssueCreateInputType
  ): Promise<ForgeIssueCreatedType>;

  createComment(issue: ForgeIssueRefType, body: string): Promise<void>;

  /**
   * 可选：上传可供 Issue 引用的资源。未实现时调用方应跳过附件同步。
   */
  uploadAsset?(
    input: ForgeAssetUploadInputType
  ): Promise<ForgeAssetUploadedType>;
}
