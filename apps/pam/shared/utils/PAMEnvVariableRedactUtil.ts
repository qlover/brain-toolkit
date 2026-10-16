import type {
  PAMEnvWriteable,
  PAMVariable
} from '@schemas/PAMEnvironmentSchema';
import { PAMEnvVariableNormalizeUtil } from './PAMEnvVariableNormalizeUtil';

/**
 * Redacts sensitive environment variable values for API responses.
 *
 * Significance: Prevents sensitive secrets from leaving the server.
 * Core idea: Keep metadata (`key` / `id` / `sensitive`) and clear `value`.
 * Main function: Map environments/variables to a safe response shape.
 * Main purpose: Enforce "sensitive values are never returned on query".
 *
 * @example
 * const safe = PAMEnvVariableRedactUtil.redactEnvironments(envs);
 */
export class PAMEnvVariableRedactUtil {
  /**
   * Clears values for sensitive variables.
   *
   * @param variables - Variables to redact
   * @param replacement - Value used instead (empty, or the env placeholder)
   * @returns Variables with sensitive values replaced
   */
  public static redactVariables(
    variables: PAMVariable[] | undefined,
    replacement = ''
  ): PAMVariable[] | undefined {
    if (variables === undefined) {
      return undefined;
    }

    return PAMEnvVariableNormalizeUtil.normalizeVariables(variables).map(
      (variable: PAMVariable): PAMVariable => {
        if (!variable.sensitive) {
          return variable;
        }
        return {
          ...variable,
          value: replacement
        };
      }
    );
  }

  /**
   * Redacts sensitive variable values across environments.
   *
   * @param environments - Environments that may contain variables
   * @returns Environments safe for API responses
   */
  public static redactEnvironments(
    environments: PAMEnvWriteable[]
  ): PAMEnvWriteable[] {
    return environments.map(
      (environment: PAMEnvWriteable): PAMEnvWriteable => ({
        ...environment,
        variables: this.redactVariables(environment.variables)
      })
    );
  }
}
