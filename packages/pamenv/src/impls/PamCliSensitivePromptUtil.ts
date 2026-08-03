import { checkbox } from '@inquirer/prompts';
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
      `${candidateKeys.length} new variable(s) are not marked sensitive. Choose some now?`
    );
    if (!wants) {
      return [];
    }

    return checkbox({
      message: 'Select new keys to mark as sensitive',
      choices: candidateKeys.map((key) => ({ name: key, value: key }))
    });
  }
}
