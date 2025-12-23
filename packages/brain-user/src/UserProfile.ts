import type {
  BrainUserProfileInterface,
  BrainUserPermissions
} from './types/BrainUserTypes';

/**
 * User profile management class for Brain user profile data
 *
 * Significance: Centralized management of user profile information
 * Core idea: Encapsulate profile data with type-safe access methods
 * Main function: Provide convenient methods to access and manipulate user profile data
 * Main purpose: Simplify user profile data handling with validation and type safety
 *
 * @example
 * ```ts
 * const profile = new BrainUserProfile({
 *   phone_number: '+1234567890',
 *   da_email: 'user@example.com',
 *   permissions: [{ key: 'restricted_resources', value: ['exec-poll'] }],
 *   profile_img_url: 'https://s3.amazonaws.com/brain-user-profile-images/123.jpg',
 *   email_verified: true
 * });
 *
 * console.log(profile.getPhoneNumber()); // '+1234567890'
 * console.log(profile.hasPermission('restricted_resources')); // true
 * console.log(profile.isEmailVerified()); // true
 * ```
 */
export class UserProfile {
  constructor(protected profile: BrainUserProfileInterface) {}

  /**
   * Get the complete profile object
   *
   * @returns The complete user profile interface
   */
  public getProfile(): BrainUserProfileInterface {
    return this.profile;
  }

  /**
   * Set the complete profile object
   *
   * @param profile - The new profile data to set
   */
  public setProfile(profile: BrainUserProfileInterface): void {
    this.profile = profile;
  }

  /**
   * Update partial profile data
   *
   * @param partialProfile - Partial profile data to merge with existing profile
   */
  public updateProfile(
    partialProfile: Partial<BrainUserProfileInterface>
  ): void {
    this.profile = { ...this.profile, ...partialProfile };
  }

  /**
   * Get the phone number from profile
   *
   * @returns The phone number or undefined if not set
   */
  public getPhoneNumber(): string | undefined {
    return this.profile.phone_number;
  }

  /**
   * Set the phone number
   *
   * @param phoneNumber - The phone number to set
   */
  public setPhoneNumber(phoneNumber: string): void {
    this.profile.phone_number = phoneNumber;
  }

  /**
   * Get the DA email from profile
   *
   * @returns The DA email or undefined if not set
   */
  public getDaEmail(): string | undefined {
    return this.profile.da_email;
  }

  /**
   * Set the DA email
   *
   * @param email - The DA email to set
   */
  public setDaEmail(email: string): void {
    this.profile.da_email = email;
  }

  /**
   * Get the DA email password from profile
   *
   * @returns The DA email password or undefined if not set
   */
  public getDaEmailPassword(): string | undefined {
    return this.profile.da_email_password;
  }

  /**
   * Set the DA email password
   *
   * @param password - The DA email password to set
   */
  public setDaEmailPassword(password: string): void {
    this.profile.da_email_password = password;
  }

  /**
   * Get the certificate from profile
   *
   * @returns The certificate or undefined if not set
   */
  public getCertificate(): string | undefined {
    return this.profile.certificate;
  }

  /**
   * Set the certificate
   *
   * @param certificate - The certificate to set
   */
  public setCertificate(certificate: string): void {
    this.profile.certificate = certificate;
  }

  /**
   * Get all permissions from profile
   *
   * @returns Array of permissions or empty array if not set
   */
  public getPermissions(): BrainUserPermissions[] {
    return this.profile.permissions || [];
  }

  /**
   * Set permissions
   *
   * @param permissions - The permissions array to set
   */
  public setPermissions(permissions: BrainUserPermissions[]): void {
    this.profile.permissions = permissions;
  }

  /**
   * Check if user has a specific permission key
   *
   * @param key - The permission key to check
   * @returns True if the permission key exists, false otherwise
   */
  public hasPermission(key: string): boolean {
    const permissions = this.getPermissions();
    return permissions.some((permission) => permission.key === key);
  }

  /**
   * Get permission values by key
   *
   * @param key - The permission key to look up
   * @returns Array of permission values or undefined if key not found
   */
  public getPermissionValues(key: string): string[] | undefined {
    const permissions = this.getPermissions();
    const permission = permissions.find((p) => p.key === key);
    return permission?.value;
  }

  /**
   * Add a new permission or update existing one
   *
   * @param key - The permission key
   * @param values - The permission values
   */
  public addPermission(key: string, values: string[]): void {
    const permissions = this.getPermissions();
    const existingIndex = permissions.findIndex((p) => p.key === key);

    if (existingIndex >= 0) {
      permissions[existingIndex].value = values;
    } else {
      permissions.push({ key, value: values });
    }

    this.profile.permissions = permissions;
  }

  /**
   * Remove a permission by key
   *
   * @param key - The permission key to remove
   * @returns True if permission was removed, false if not found
   */
  public removePermission(key: string): boolean {
    const permissions = this.getPermissions();
    const initialLength = permissions.length;
    this.profile.permissions = permissions.filter((p) => p.key !== key);
    return this.profile.permissions.length < initialLength;
  }

  /**
   * Get the profile image URL
   *
   * @returns The profile image URL or undefined if not set
   */
  public getProfileImageUrl(): string | undefined {
    return this.profile.profile_img_url;
  }

  /**
   * Set the profile image URL
   *
   * @param url - The profile image URL to set
   */
  public setProfileImageUrl(url: string): void {
    this.profile.profile_img_url = url;
  }

  /**
   * Check if profile has an image URL
   *
   * @returns True if profile image URL exists, false otherwise
   */
  public hasProfileImage(): boolean {
    return !!this.profile.profile_img_url;
  }

  /**
   * Get the amplitude device ID
   *
   * @returns The amplitude device ID or undefined if not set
   */
  public getAmplitudeDeviceId(): unknown {
    return this.profile.amplitude_device_id;
  }

  /**
   * Set the amplitude device ID
   *
   * @param deviceId - The amplitude device ID to set
   */
  public setAmplitudeDeviceId(deviceId: unknown): void {
    this.profile.amplitude_device_id = deviceId;
  }

  /**
   * Check if email is verified
   *
   * @returns True if email is verified, false or undefined otherwise
   */
  public isEmailVerified(): boolean | undefined {
    return this.profile.email_verified;
  }

  /**
   * Set email verification status
   *
   * @param verified - The email verification status to set
   */
  public setEmailVerified(verified: boolean): void {
    this.profile.email_verified = verified;
  }
}

