const DEVICE_UID_KEY = 'brain_example_device_uid';

/**
 * Stable device id for userly `X-Brain-Device-Uid` header in the example app.
 */
export function getDeviceUid(): string {
  try {
    const existing = localStorage.getItem(DEVICE_UID_KEY);
    if (existing) {
      return existing;
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `device-${Date.now()}`;
    localStorage.setItem(DEVICE_UID_KEY, id);
    return id;
  } catch {
    return 'brain-example-device';
  }
}
