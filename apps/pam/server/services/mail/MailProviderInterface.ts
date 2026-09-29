import type { PamMailProvider } from '@schemas/PamMailSchema';

export type MailAddress = {
  readonly email: string;
  readonly name?: string;
};

export type MailSendInput = {
  readonly from: MailAddress;
  readonly to: string;
  readonly replyTo?: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};

export type MailSendResult = {
  /** Provider-side message id when available (e.g. Resend `id`). */
  readonly messageId: string | null;
};

/**
 * Transactional mail channel. Independent from Supabase Auth mails; every
 * send is audited in `pam_mail_logs` by `MailService`.
 */
export interface MailProviderInterface {
  readonly name: PamMailProvider;

  /** Throws `ExecutorError` when not configured or the provider rejects. */
  send(input: MailSendInput): Promise<MailSendResult>;

  /** Whether Admin may read the message body (links included) in mail logs. */
  exposeContent(): boolean;
}
