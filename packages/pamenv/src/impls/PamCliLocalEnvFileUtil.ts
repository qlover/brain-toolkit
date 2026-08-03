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
}
