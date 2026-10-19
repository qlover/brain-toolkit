import { checkbox } from '@inquirer/prompts';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_SENSITIVE_SELECT_KEYS,
  PAMENV_CLI_SENSITIVE_UNMARKED_CONFIRM
} from '../i18n/identifier/pamenv_cli';
import { PamCliConfirmUtil } from './PamCliConfirmUtil';
import { PamCliEnvDiffUtil } from './PamCliEnvDiffUtil';

/**
 * Interactive helpers for marking newly created variables as sensitive.
 *
 * Significance: Dotenv has no native sensitive flag without unchecked annotation.
 * Core idea: Honor `# pam:sensitive`, then let users pick unmarked new keys.
 * Main function: Prompt which new keys should be sensitive.
 * Main purpose: Safer first-time secret uploads on `pamenv push`.
 *
 * @example
 * const keys = await PamCliSensitivePromptUtil.pickNewSensitiveKeys(['A', 'B']);
 */
export class PamCliSensitivePromptUtil {
  /**
   * Asks which newly created unmarked keys should be sensitive.
   * Keys that look like secrets are pre-checked as a hint only.
   *
   * @param candidateKeys - New local keys without `# pam:sensitive`
   * @returns Keys the user marked sensitive (empty when none / skipped)
   */
  public static async pickNewSensitiveKeys(
    candidateKeys: readonly string[]
  ): Promise<string[]> {
    if (candidateKeys.length === 0) {
      return [];
    }

    const suggested = candidateKeys.filter((key) =>
      PamCliEnvDiffUtil.looksSensitiveKey(key)
    );
    const confirmMessage =
      suggested.length > 0
        ? PamCliI18n.t(PAMENV_CLI_SENSITIVE_UNMARKED_CONFIRM, {
            count: candidateKeys.length
          }) + ` (${suggested.join(', ')})`
        : PamCliI18n.t(PAMENV_CLI_SENSITIVE_UNMARKED_CONFIRM, {
            count: candidateKeys.length
          });

    const wants = await PamCliConfirmUtil.ask(confirmMessage);
    if (!wants) {
      return [];
    }

    return checkbox({
      message: PamCliI18n.t(PAMENV_CLI_SENSITIVE_SELECT_KEYS),
      choices: candidateKeys.map((key) => ({
        name: PamCliEnvDiffUtil.looksSensitiveKey(key) ? `${key} *` : key,
        value: key,
        checked: PamCliEnvDiffUtil.looksSensitiveKey(key)
      }))
    });
  }
}
