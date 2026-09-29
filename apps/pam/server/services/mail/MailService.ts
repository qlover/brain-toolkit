import { ExecutorError } from '@qlover/fe-corekit/executor';
import { inject, injectable } from '@shared/container';
import type { LocaleType } from '@config/i18n';
import {
  API_MAIL_PROVIDER_NOT_READY,
  API_MAIL_RECIPIENT_INVALID
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import type {
  PamMailLogAdminItem,
  PamMailProviderSetting,
  PamMailTemplate
} from '@schemas/PamMailSchema';
import { pamMailProviderSettingSchema } from '@schemas/PamMailSchema';
import { PamMailLogsRepo } from '@server/repositorys/PamMailLogsRepo';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import { renderTestMail, type RenderedMail } from './mailTemplates';
import { MemoryMailProvider } from './MemoryMailProvider';
import { ResendMailProvider } from './ResendMailProvider';
import type {
  MailAddress,
  MailProviderInterface,
  MailSendResult
} from './MailProviderInterface';
import type { LoggerInterface } from '@qlover/logger';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FROM_NAME = 'PAM';

export type MailSendParams = {
  readonly to: string;
  readonly template: PamMailTemplate;
  readonly mail: RenderedMail;
  readonly userId?: string | null;
  readonly clientIp?: string | null;
};

type SenderConfig = {
  readonly from: MailAddress;
  readonly replyTo?: string;
};

/**
 * Transactional mail independent from Supabase Auth mails.
 * Resolves the provider from `mail.provider`, sends, and audits to `pam_mail_logs`.
 */
@injectable()
export class MailService {
  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService,
    @inject(PamMailLogsRepo) protected readonly logsRepo: PamMailLogsRepo,
    @inject(MemoryMailProvider)
    protected readonly memoryProvider: MemoryMailProvider,
    @inject(ResendMailProvider)
    protected readonly resendProvider: ResendMailProvider
  ) {}

  public async isEnabled(): Promise<boolean> {
    return (await this.resolveProviderSetting()) !== 'disabled';
  }

  /** Display name used as the product name in templates. */
  public async getSiteName(): Promise<string> {
    const name = (
      await this.siteSettings.getString(PAM_SITE_SETTING_KEYS.MAIL_FROM_NAME)
    ).trim();
    return name || DEFAULT_FROM_NAME;
  }

  /** Sends and audits; throws `ExecutorError` on any failure. */
  public async send(params: MailSendParams): Promise<MailSendResult> {
    const to = params.to.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(to)) {
      throw new ExecutorError(API_MAIL_RECIPIENT_INVALID);
    }

    const provider = await this.resolveProvider();
    const sender = await this.resolveSender();

    try {
      const result = await provider.send({
        from: sender.from,
        to,
        replyTo: sender.replyTo,
        subject: params.mail.subject,
        html: params.mail.html,
        text: params.mail.text
      });
      await this.writeLog(provider, params, to, {
        status: 'sent',
        providerMessageId: result.messageId
      });
      return result;
    } catch (error) {
      await this.writeLog(provider, params, to, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /** For best-effort notifications: never throws, returns whether it was sent. */
  public async sendSafely(params: MailSendParams): Promise<boolean> {
    try {
      if (!(await this.isEnabled())) {
        return false;
      }
      await this.send(params);
      return true;
    } catch (error) {
      this.logger.warn('Mail send skipped/failed', {
        to: params.to,
        template: params.template,
        error
      });
      return false;
    }
  }

  public async sendTest(params: {
    to: string;
    locale: LocaleType;
    userId?: string | null;
    clientIp?: string | null;
  }): Promise<MailSendResult> {
    const siteName = await this.getSiteName();
    return this.send({
      to: params.to,
      template: 'test',
      mail: renderTestMail({ locale: params.locale, siteName }),
      userId: params.userId,
      clientIp: params.clientIp
    });
  }

  public async listForAdmin(params: {
    limit?: number;
    email?: string;
    template?: PamMailTemplate;
  }): Promise<PamMailLogAdminItem[]> {
    return this.logsRepo.listRecent(params);
  }

  protected async resolveProviderSetting(): Promise<PamMailProviderSetting> {
    const raw = (
      await this.siteSettings.getString(PAM_SITE_SETTING_KEYS.MAIL_PROVIDER)
    )
      .trim()
      .toLowerCase();
    const parsed = pamMailProviderSettingSchema.safeParse(raw);
    return parsed.success ? parsed.data : 'disabled';
  }

  protected async resolveProvider(): Promise<MailProviderInterface> {
    const setting = await this.resolveProviderSetting();
    if (setting === 'resend') {
      return this.resendProvider;
    }
    if (setting === 'memory') {
      return this.memoryProvider;
    }
    throw new ExecutorError(
      API_MAIL_PROVIDER_NOT_READY,
      'Mail provider is disabled (Admin site settings mail.provider)'
    );
  }

  protected async resolveSender(): Promise<SenderConfig> {
    const [fromAddress, fromName, replyTo] = await Promise.all([
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.MAIL_FROM_ADDRESS),
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.MAIL_FROM_NAME),
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.MAIL_REPLY_TO)
    ]);

    const email = fromAddress.trim();
    if (!EMAIL_PATTERN.test(email)) {
      throw new ExecutorError(
        API_MAIL_PROVIDER_NOT_READY,
        'Sender address is missing (Admin site settings mail.from_address)'
      );
    }

    const reply = replyTo.trim();
    return {
      from: { email, name: fromName.trim() || DEFAULT_FROM_NAME },
      replyTo: EMAIL_PATTERN.test(reply) ? reply : undefined
    };
  }

  protected async writeLog(
    provider: MailProviderInterface,
    params: MailSendParams,
    to: string,
    outcome: {
      status: 'sent' | 'failed';
      providerMessageId?: string | null;
      error?: string | null;
    }
  ): Promise<void> {
    try {
      await this.logsRepo.insert({
        toEmail: to,
        subject: params.mail.subject,
        template: params.template,
        provider: provider.name,
        status: outcome.status,
        providerMessageId: outcome.providerMessageId ?? null,
        error: outcome.error ?? null,
        bodyText: provider.exposeContent() ? params.mail.text : null,
        userId: params.userId ?? null,
        createdIp: params.clientIp ?? null
      });
    } catch (error) {
      this.logger.warn('Failed to write mail log', {
        to,
        template: params.template,
        error
      });
    }
  }
}
