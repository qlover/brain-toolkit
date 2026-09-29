import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type {
  MailProviderInterface,
  MailSendInput,
  MailSendResult
} from './MailProviderInterface';
import type { LoggerInterface } from '@qlover/logger';

/**
 * Does not deliver anything; the message body is kept in `pam_mail_logs`
 * so operators can read it in Admin (dev / test flow).
 */
@injectable()
export class MemoryMailProvider implements MailProviderInterface {
  public readonly name = 'memory' as const;

  constructor(@inject(I.Logger) protected readonly logger: LoggerInterface) {}

  /**
   * @override
   */
  public async send(input: MailSendInput): Promise<MailSendResult> {
    this.logger.info('Memory mail captured', {
      to: input.to,
      subject: input.subject
    });
    return { messageId: null };
  }

  /**
   * @override
   */
  public exposeContent(): boolean {
    return true;
  }
}
