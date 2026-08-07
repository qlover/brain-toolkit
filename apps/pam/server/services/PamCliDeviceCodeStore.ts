import { randomBytes } from 'crypto';
import type { PamCliTokenResponse } from '@schemas/PamCliSchema';
import type { UserSchema } from '@qlover/next-kit/common';

export const PamCliDeviceStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Denied: 'denied',
  Consumed: 'consumed'
} as const;

export type PamCliDeviceStatusType =
  (typeof PamCliDeviceStatus)[keyof typeof PamCliDeviceStatus];

export type PamCliDeviceCodeRecordType = {
  readonly deviceCode: string;
  readonly userCode: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly intervalSeconds: number;
  status: PamCliDeviceStatusType;
  user?: UserSchema;
  tokenResponse?: PamCliTokenResponse;
  /** Browser locale captured at approve time. */
  locale?: 'en' | 'zh';
};

type GlobalDeviceStoreType = {
  __pamCliDeviceCodeStore?: Map<string, PamCliDeviceCodeRecordType>;
  __pamCliDeviceUserCodeIndex?: Map<string, string>;
};

/**
 * In-process device-code store for PAM CLI browser login.
 *
 * Significance: Bridges browser approve UI and CLI polling.
 * Core idea: RFC 8628-style device authorization (single-node memory).
 * Main function: Create / lookup / approve / consume device codes.
 * Main purpose: Support `pam login` browser flow in local/dev PAM.
 *
 * @example
 * const record = PamCliDeviceCodeStore.create();
 */
export class PamCliDeviceCodeStore {
  public static readonly DEFAULT_EXPIRES_SECONDS = 15 * 60;
  public static readonly DEFAULT_INTERVAL_SECONDS = 5;

  protected static getStore(): Map<string, PamCliDeviceCodeRecordType> {
    const globalRef = globalThis as GlobalDeviceStoreType;
    if (!globalRef.__pamCliDeviceCodeStore) {
      globalRef.__pamCliDeviceCodeStore = new Map();
    }
    return globalRef.__pamCliDeviceCodeStore;
  }

  protected static getUserCodeIndex(): Map<string, string> {
    const globalRef = globalThis as GlobalDeviceStoreType;
    if (!globalRef.__pamCliDeviceUserCodeIndex) {
      globalRef.__pamCliDeviceUserCodeIndex = new Map();
    }
    return globalRef.__pamCliDeviceUserCodeIndex;
  }

  /**
   * Creates a new pending device authorization.
   */
  public static create(): PamCliDeviceCodeRecordType {
    this.cleanupExpired();

    const deviceCode = randomBytes(32).toString('hex');
    const userCode = this.generateUserCode();
    const now = Date.now();
    const record: PamCliDeviceCodeRecordType = {
      deviceCode,
      userCode,
      createdAt: now,
      expiresAt: now + this.DEFAULT_EXPIRES_SECONDS * 1000,
      intervalSeconds: this.DEFAULT_INTERVAL_SECONDS,
      status: PamCliDeviceStatus.Pending
    };

    this.getStore().set(deviceCode, record);
    this.getUserCodeIndex().set(userCode, deviceCode);
    return record;
  }

  /**
   * @param deviceCode - Opaque device code from CLI
   */
  public static getByDeviceCode(
    deviceCode: string
  ): PamCliDeviceCodeRecordType | null {
    const record = this.getStore().get(deviceCode);
    if (!record) {
      return null;
    }
    if (record.expiresAt <= Date.now()) {
      this.remove(record);
      return null;
    }
    return record;
  }

  /**
   * @param userCode - Human-readable code shown in CLI / URL
   */
  public static getByUserCode(
    userCode: string
  ): PamCliDeviceCodeRecordType | null {
    const normalized = this.normalizeUserCode(userCode);
    const deviceCode = this.getUserCodeIndex().get(normalized);
    if (!deviceCode) {
      return null;
    }
    return this.getByDeviceCode(deviceCode);
  }

  /**
   * Marks a pending authorization as approved and attaches issued token.
   *
   * @param userCode - User code from the approve page
   * @param user - Authenticated browser user
   * @param tokenResponse - Issued CLI token payload
   * @param locale - Optional browser UI locale to return on poll
   */
  public static approve(
    userCode: string,
    user: UserSchema,
    tokenResponse: PamCliTokenResponse,
    locale?: 'en' | 'zh'
  ): PamCliDeviceCodeRecordType {
    const record = this.getByUserCode(userCode);
    if (!record) {
      throw new Error('device_code_expired');
    }
    if (record.status !== PamCliDeviceStatus.Pending) {
      throw new Error('device_code_not_pending');
    }

    record.status = PamCliDeviceStatus.Approved;
    record.user = user;
    record.locale = locale;
    record.tokenResponse = locale
      ? { ...tokenResponse, locale }
      : tokenResponse;
    return record;
  }

  /**
   * Consumes an approved token once for the polling CLI.
   *
   * @param deviceCode - Opaque device code
   */
  public static consumeApproved(
    deviceCode: string
  ): PamCliTokenResponse | null {
    const record = this.getByDeviceCode(deviceCode);
    if (!record || record.status !== PamCliDeviceStatus.Approved) {
      return null;
    }
    if (!record.tokenResponse) {
      return null;
    }
    const token = record.tokenResponse;
    record.status = PamCliDeviceStatus.Consumed;
    this.remove(record);
    return token;
  }

  protected static remove(record: PamCliDeviceCodeRecordType): void {
    this.getStore().delete(record.deviceCode);
    this.getUserCodeIndex().delete(record.userCode);
  }

  protected static cleanupExpired(): void {
    const now = Date.now();
    for (const record of this.getStore().values()) {
      if (
        record.expiresAt <= now ||
        record.status === PamCliDeviceStatus.Consumed
      ) {
        this.remove(record);
      }
    }
  }

  protected static generateUserCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let raw = '';
    const bytes = randomBytes(8);
    for (let i = 0; i < 8; i += 1) {
      raw += alphabet[bytes[i]! % alphabet.length];
    }
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }

  protected static normalizeUserCode(userCode: string): string {
    const compact = userCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (compact.length !== 8) {
      return userCode.trim().toUpperCase();
    }
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
}
