import { resolve } from 'node:path';

/**
 * Local working-directory env file naming for pull / push.
 *
 * Significance: Keeps pull and push on the same `.env.<envName>` convention.
 * Core idea: One local dotenv file per PAM environment name.
 * Main function: Build dotenv filenames from environment names.
 * Main purpose: Write/read env files in the current project directory.
 *
 * @example
 * PamCliLocalEnvFileUtil.toFileName('staging'); // '.env.staging'
 */
export class PamCliLocalEnvFileUtil {
  /**
   * Builds a dotenv filename: `.env.${environmentName}`.
   *
   * @param environmentName - PAM environment name
   * @returns Filename such as `.env.staging`
   */
  public static toFileName(environmentName: string): string {
    const envName = environmentName.trim();
    if (!envName) {
      throw new Error('Environment name is required to build the local file');
    }
    return `.env.${envName}`;
  }

  /**
   * Resolves the local dotenv path for pull / push.
   *
   * Default: `{outDir}/.env.{envName}`. With `file`, relative paths join `outDir`.
   *
   * @param outDir - Working directory (`-o` or cwd)
   * @param environmentName - PAM environment name (default filename)
   * @param file - Optional override (`--file`, e.g. `.env`)
   */
  public static resolveLocalPath(
    outDir: string,
    environmentName: string,
    file?: string
  ): string {
    const override = file?.trim();
    if (override) {
      return resolve(outDir, override);
    }
    return resolve(outDir, this.toFileName(environmentName));
  }
}
