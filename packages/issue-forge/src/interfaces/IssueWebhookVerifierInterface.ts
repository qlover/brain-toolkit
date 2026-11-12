import type { IssueWebhookVerifyResultType } from '../types/IssueForgeTypes';

/**
 * Webhook 签名校验（secret 在构造时绑定）。
 */
export interface IssueWebhookVerifierInterface {
  verify(
    rawBody: string,
    signatureHeader: string | null
  ): Promise<IssueWebhookVerifyResultType>;
}
