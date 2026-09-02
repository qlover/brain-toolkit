import { ExecutorError } from '@qlover/fe-corekit/executor';
import { injectable } from '@shared/container';
import { API_OTP_PROVIDER_NOT_READY } from '@config/i18n-identifier/api';
import type {
  PhoneOtpProviderInterface,
  PhoneOtpSendContext
} from './PhoneOtpProviderInterface';

/**
 * Placeholder for Aliyun SMS. Switch site setting when implemented.
 */
@injectable()
export class AliyunPhoneOtpProvider implements PhoneOtpProviderInterface {
  public readonly name = 'aliyun' as const;

  /**
   * @override
   */
  public async send(_context: PhoneOtpSendContext): Promise<void> {
    throw new ExecutorError(
      API_OTP_PROVIDER_NOT_READY,
      'Aliyun phone OTP provider is not configured yet'
    );
  }

  /**
   * @override
   */
  public exposePlainCode(): boolean {
    return false;
  }
}
