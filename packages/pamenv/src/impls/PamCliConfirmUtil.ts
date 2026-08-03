import { confirm } from '@inquirer/prompts';

/**
 * Interactive yes/no confirmation helper for CLI commands.
 *
 * Significance: Shared abort path for destructive or overwrite actions.
 * Core idea: Default to no; cancel returns false without throwing.
 * Main function: Prompt the user and return whether to continue.
 * Main purpose: Secondary confirmation for `pamenv push`.
 *
 * @example
 * if (!(await PamCliConfirmUtil.ask('Push now?'))) return;
 */
export class PamCliConfirmUtil {
  /**
   * @param message - Confirm prompt message
   * @returns True when the user confirms
   */
  public static async ask(message: string): Promise<boolean> {
    return confirm({
      message,
      default: false
    });
  }
}
