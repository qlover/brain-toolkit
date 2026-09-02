import type { PamPhoneOtpProvider } from '@schemas/PamPhoneOtpSchema';

export type PhoneOtpSendContext = {
  readonly phone: string;
  readonly code: string;
  readonly expiresAt: Date;
};

/**
 * How OTP is delivered. Verification always goes through pam_phone_otps.
 */
export interface PhoneOtpProviderInterface {
  readonly name: PamPhoneOtpProvider;

  /**
   * Deliver OTP (or no-op for memory). Must not throw for successful "queued".
   */
  send(context: PhoneOtpSendContext): Promise<void>;

  /** Whether Admin may show plaintext code. */
  exposePlainCode(): boolean;
}
