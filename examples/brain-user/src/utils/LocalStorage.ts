import type { SyncStorageInterface } from '@qlover/fe-corekit';

class LocalStorage implements SyncStorageInterface<string> {
  protected storage: Storage;

  constructor() {
    this.storage = window.localStorage;
  }

  /**
   * @override
   */
  public getItem<T>(key: string, defaultValue?: T | undefined): T | null {
    const value = this.storage.getItem(key);
    return value ? JSON.parse(value) : (defaultValue ?? null);
  }
  /**
   * @override
   */
  public setItem<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
  }
  /**
   * @override
   */
  public removeItem(key: string): void {
    this.storage.removeItem(key);
  }
  /**
   * @override
   */
  public clear(): void {
    this.storage.clear();
  }
  public key(index: number): string | null {
    return this.storage.key(index);
  }
  /**
   * @override
   */
  public get length(): number {
    return this.storage.length;
  }
}

export const localStorage = new LocalStorage();
