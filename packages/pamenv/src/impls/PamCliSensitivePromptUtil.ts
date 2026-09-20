import { checkbox } from '@inquirer/prompts';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_SENSITIVE_SELECT_KEYS,
  PAMENV_CLI_SENSITIVE_UNMARKED_CONFIRM
} from '../i18n/identifier/pamenv_cli';
import { PamCliConfirmUtil } from './PamCliConfirmUtil';

/**
 * Interactive helpers for marking newly created variables as sensitive.
 *
 * Significance: Dotenv has no native sensitive flag without annotations.
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

    const wants = await PamCliConfirmUtil.ask(
      PamCliI18n.t(PAMENV_CLI_SENSITIVE_UNMARKED_CONFIRM, {
        count: candidateKeys.length
      })
    );
    if (!wants) {
      return [];
    }

    return checkbox({
      message: PamCliI18n.t(PAMENV_CLI_SENSITIVE_SELECT_KEYS),
      choices: candidateKeys.map((key) => ({ name: key, value: key }))
    });
  }
}
