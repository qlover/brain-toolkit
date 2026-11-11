import type { SeedSrcConfigInterface } from '@interfaces/SeedConfigInterface';
import { name, version } from '../../package.json';

export class AppConfig implements SeedSrcConfigInterface {
  /** 当前 PAM 环境名（`PAM_ENV`：`local` / `dev` …） */
  public readonly env: string = process.env.PAM_ENV ?? 'local';
  public readonly name: string = name;
  public readonly version: string = version;
  public readonly isProduction: boolean = process.env.NODE_ENV === 'production';
  public readonly logLevel: string =
    process.env.NEXT_PUBLIC_LOG_LEVEL ?? 'info';

  public readonly testLoginEmail: string =
    process.env.NEXT_PUBLIC_LOGIN_USER ?? '';
  public readonly testLoginPassword: string =
    process.env.NEXT_PUBLIC_LOGIN_PASSWORD ?? '';

  public readonly stringEncryptorKey: string =
    process.env.NEXT_PUBLIC_STRING_ENCRYPT_KEY ?? 'demo_string_encryptor_key';

  public readonly pamStorageKey: string =
    process.env.NEXT_PUBLIC_PAM_STORAGE_KEY ?? 'pam_storage_key';
}
