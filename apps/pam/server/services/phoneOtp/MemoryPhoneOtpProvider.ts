import { injectable } from '@shared/container';
import type {
  PhoneOtpProviderInterface,
  PhoneOtpSendContext
} from './PhoneOtpProviderInterface';

/**
 * No SMS. Code is stored in pam_phone_otps.code_plain for Admin monitoring.
 */
@injectable()
export class MemoryPhoneOtpProvider implements PhoneOtpProviderInterface {
  public readonly name = 'memory' as const;

  /**
   * @override
   */
  public async send(_context: PhoneOtpSendContext): Promise<void> {
    // Intentionally empty — Admin panel is the delivery channel in test mode.
  }

  /**
   * @override
   */
  public exposePlainCode(): boolean {
    return true;
  }
}
