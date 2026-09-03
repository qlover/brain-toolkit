import { ExecutorError } from '@qlover/fe-corekit/executor';
import { inject, injectable } from '@shared/container';
import {
  API_OTP_PROVIDER_NOT_READY,
  API_OTP_SEND_FAILED
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import { sendAliyunDysms } from './aliyunDysmsSend';
import type {
  PhoneOtpProviderInterface,
  PhoneOtpSendContext
} from './PhoneOtpProviderInterface';
import type { LoggerInterface } from '@qlover/logger';

type AliyunSmsRuntimeConfig = {
  readonly accessKeyId: string;
  readonly accessKeySecret: string;
  readonly signName: string;
  readonly templateCode: string;
  readonly templateParamKey: string;
  readonly regionId: string;
  readonly endpoint: string;
};

/**
 * Aliyun DysmsAPI SendSms.
 * Credentials from Admin site settings (`aliyun_sms.*`) only.
 * Does not expose plaintext OTP to Admin.
 */
@injectable()
export class AliyunPhoneOtpProvider implements PhoneOtpProviderInterface {
  public readonly name = 'aliyun' as const;

  constructor(
    @inject(I.Logger) protected readonly logger: LoggerInterface,
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService
  ) {}

  /**
   * @override
   */
  public async send(context: PhoneOtpSendContext): Promise<void> {
    const sms = await this.resolveConfig();

    if (
      !sms.accessKeyId ||
      !sms.accessKeySecret ||
      !sms.signName ||
      !sms.templateCode
    ) {
      throw new ExecutorError(
        API_OTP_PROVIDER_NOT_READY,
        'Aliyun SMS is incomplete (configure Admin site settings aliyun_sms.*)'
      );
    }

    let result;
    try {
      result = await sendAliyunDysms({
        accessKeyId: sms.accessKeyId,
        accessKeySecret: sms.accessKeySecret,
        signName: sms.signName,
        templateCode: sms.templateCode,
        templateParamKey: sms.templateParamKey,
        regionId: sms.regionId,
        endpoint: sms.endpoint,
        phone: context.phone,
        code: context.code
      });
    } catch (error) {
      this.logger.error('Aliyun SMS request failed', {
        phone: context.phone,
        error
      });
      throw new ExecutorError(
        API_OTP_SEND_FAILED,
        error instanceof Error ? error.message : 'Aliyun SMS request failed'
      );
    }

    if (result.code !== 'OK') {
      this.logger.error('Aliyun SMS rejected', {
        phone: context.phone,
        code: result.code,
        message: result.message,
        requestId: result.requestId
      });
      throw new ExecutorError(
        API_OTP_SEND_FAILED,
        `Aliyun SMS ${result.code}: ${result.message}`
      );
    }

    this.logger.info('Aliyun SMS accepted', {
      phone: context.phone,
      requestId: result.requestId,
      bizId: result.bizId
    });
  }

  /**
   * @override
   */
  public exposePlainCode(): boolean {
    return false;
  }

  protected async resolveConfig(): Promise<AliyunSmsRuntimeConfig> {
    const [
      accessKeyId,
      accessKeySecret,
      signName,
      templateCode,
      templateParamKey,
      regionId,
      endpoint
    ] = await Promise.all([
      this.siteSettings.getString(
        PAM_SITE_SETTING_KEYS.ALIYUN_SMS_ACCESS_KEY_ID
      ),
      this.siteSettings.getSecretString(
        PAM_SITE_SETTING_KEYS.ALIYUN_SMS_ACCESS_KEY_SECRET
      ),
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.ALIYUN_SMS_SIGN_NAME),
      this.siteSettings.getString(
        PAM_SITE_SETTING_KEYS.ALIYUN_SMS_TEMPLATE_CODE
      ),
      this.siteSettings.getString(
        PAM_SITE_SETTING_KEYS.ALIYUN_SMS_TEMPLATE_PARAM_KEY
      ),
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.ALIYUN_SMS_REGION_ID),
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.ALIYUN_SMS_ENDPOINT)
    ]);

    return {
      accessKeyId: accessKeyId.trim(),
      accessKeySecret: accessKeySecret.trim(),
      signName: signName.trim(),
      templateCode: templateCode.trim(),
      templateParamKey: templateParamKey.trim() || 'code',
      regionId: regionId.trim() || 'cn-hangzhou',
      endpoint: endpoint.trim() || 'https://dysmsapi.aliyuncs.com'
    };
  }
}
