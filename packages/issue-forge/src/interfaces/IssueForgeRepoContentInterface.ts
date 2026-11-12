/**
 * 仓库文本读 / 分支初始化 / 文件上传（读 Issue 模板、截图落仓等）。
 * 形态 B：实例已绑定鉴权与目标仓。
 */
export type IssueForgeRepoFileType = {
  readonly path: string;
  readonly content: string;
};

export type IssueForgeRepoFileUploadInputType = {
  readonly path: string;
  readonly contentBase64: string;
  readonly branch: string;
  readonly message: string;
};

export type IssueForgeRepoFileUploadedType = {
  readonly url: string;
};

export interface IssueForgeRepoContentInterface {
  readTextFile(path: string): Promise<string | null>;

  ensureBranch(
    branch: string,
    initialFile: IssueForgeRepoFileType
  ): Promise<void>;

  uploadFile(
    input: IssueForgeRepoFileUploadInputType
  ): Promise<IssueForgeRepoFileUploadedType>;
}
