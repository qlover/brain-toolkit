import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_EXPORT_SENSITIVE_LEAK,
  PAMENV_CLI_NOT_LOGGED_IN,
  PAMENV_CLI_NOT_LOGGED_IN_LOCAL,
  PAMENV_CLI_NO_INJECT_PERMISSION,
  PAMENV_CLI_NOT_OWNER_EXPORT,
  PAMENV_CLI_NOT_OWNER_PUSH,
  PAMENV_CLI_PERMISSIONS_MISSING,
  PAMENV_CLI_RUN_PROJECT_MISMATCH,
  PAMENV_CLI_USING_CONFIG
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type {
  PamCliExportResultType,
  PamCliProjectType,
  PamCliResolvedVarType
} from '../interfaces/PamCliTypes';
import { PamCliApiError } from './PamCliApiError';
import { PamCliDotenvUtil } from './PamCliDotenvUtil';
import { PamCliProjectAccessUtil } from './PamCliProjectAccessUtil';
import { PamCliProjectResolveUtil } from './PamCliProjectResolveUtil';
import { PamCliSensitivePlaceholderUtil } from './PamCliSensitivePlaceholderUtil';

export type PamCliRedactedExportVarsType = {
  readonly variables: readonly PamCliResolvedVarType[];
  readonly sensitiveKeys: ReadonlySet<string>;
  readonly placeholder: string;
  /** Sensitive keys forced to the env placeholder (including leaked plaintext). */
  readonly placeholderKeys: readonly string[];
  /** Keys the server itself marked sensitive. */
  readonly serverSensitiveKeys: ReadonlySet<string>;
  /**
   * Sensitive keys written as empty keep values when the server sent no
   * placeholder (key names are kept so a later file push does not delete them).
   */
  readonly emptyKeepKeys: readonly string[];
};

/**
 * Fail-closed preflight for pamenv commands that touch secrets or disk.
 *
 * Order: identity → exact project → permission → (caller API) → export sanity.
 * Any failure throws before local writes or process injection.
 */
export class PamCliSecurityGate {
  /**
   * Requires a token on the active `.pam` root and prints which identity is used.
   * Local `.pam` never falls back to `~/.pam` — missing token fails here.
   *
   * @param authStore - Active auth store
   * @param options.debug - When false, skip the "Using … config" line (errors still throw)
   */
  public static async assertIdentity(
    authStore: PamCliAuthStoreInterface,
    options?: { readonly debug?: boolean }
  ): Promise<void> {
    const token = await authStore.getToken();
    const config = await authStore.getConfig();
    const root = authStore.getActivePamRoot();
    const homeRoot = PamCliConfig.getHomeRoot();
    const kind = root === homeRoot ? 'global' : 'local';
    const email = config.email?.trim() || 'not-logged-in';

    if (options?.debug !== false) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_USING_CONFIG, {
          kind,
          path: root,
          email
        })
      );
    }

    if (!token) {
      if (kind === 'local') {
        throw new Error(
          PamCliI18n.t(PAMENV_CLI_NOT_LOGGED_IN_LOCAL, { path: root })
        );
      }
      throw new Error(PamCliI18n.t(PAMENV_CLI_NOT_LOGGED_IN));
    }
  }

  /**
   * Resolves a project by exact slug or uuid only (no substring match).
   */
  public static async resolveProjectExact(
    apiClient: PamCliApiClientInterface,
    projectRef: string
  ): Promise<PamCliProjectType> {
    return PamCliProjectResolveUtil.resolveExact(apiClient, projectRef);
  }

  public static assertCanExport(project: PamCliProjectType): void {
    this.assertPermissionsPresent(project);
    if (!PamCliProjectAccessUtil.canExport(project)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_NOT_OWNER_EXPORT, { slug: project.slug })
      );
    }
  }

  public static assertCanInject(project: PamCliProjectType): void {
    this.assertPermissionsPresent(project);
    if (!PamCliProjectAccessUtil.canInject(project)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_NO_INJECT_PERMISSION, { slug: project.slug })
      );
    }
  }

  public static assertCanEdit(project: PamCliProjectType): void {
    this.assertPermissionsPresent(project);
    if (!PamCliProjectAccessUtil.canEdit(project)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_NOT_OWNER_PUSH, { slug: project.slug })
      );
    }
  }

  /**
   * Rejects export payloads where a sensitive key still carries a real value.
   * Prefer {@link redactExportForLocalOutput} for pull/render/push — older PAM
   * builds may leak plaintext; clients must force placeholders instead of failing.
   */
  public static assertExportRedacted(
    exported: PamCliExportResultType
  ): void {
    const placeholder = exported.sensitivePlaceholder?.trim() || '';
    const sensitiveKeys = new Set(exported.sensitiveKeys || []);
    const variables = exported.variables || [];

    for (const variable of variables) {
      const sensitive =
        variable.sensitive === true || sensitiveKeys.has(variable.key);
      if (!sensitive) {
        continue;
      }
      const value = variable.value ?? '';
      if (value === '') {
        continue;
      }
      if (placeholder && value === placeholder) {
        continue;
      }
      if (PamCliSensitivePlaceholderUtil.isPlaceholder(value)) {
        continue;
      }
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_EXPORT_SENSITIVE_LEAK, {
          key: variable.key,
          slug: exported.projectSlug,
          env: exported.environmentName
        })
      );
    }
  }

  /**
   * Builds local-safe variables from an export: sensitive values become the
   * env placeholder (never plaintext). If the server omits
   * `sensitivePlaceholder`, sensitive keys are kept with an empty value so a
   * later file push still treats them as keep (not delete).
   *
   * Compatible with older PAM exports that incorrectly return plaintext for
   * keys listed in `sensitiveKeys`. Only server-marked sensitive keys are
   * redacted; unmarked lookalike names stay as plain values until the user
   * marks them.
   */
  public static redactExportForLocalOutput(
    exported: PamCliExportResultType
  ): PamCliRedactedExportVarsType {
    const placeholder = exported.sensitivePlaceholder?.trim() || '';
    const serverSensitiveKeys = new Set(exported.sensitiveKeys || []);
    const sensitiveKeys = new Set(serverSensitiveKeys);
    const source =
      exported.variables && exported.variables.length > 0
        ? exported.variables.map((variable) => ({
            key: variable.key,
            value: variable.value ?? '',
            sensitive:
              variable.sensitive === true ||
              serverSensitiveKeys.has(variable.key),
            ...(variable.comments ? { comments: [...variable.comments] } : {})
          }))
        : PamCliDotenvUtil.parse(exported.content).map((variable) => ({
            key: variable.key,
            value: variable.value,
            sensitive:
              variable.sensitive === true ||
              serverSensitiveKeys.has(variable.key),
            ...(variable.comments ? { comments: [...variable.comments] } : {})
          }));

    const placeholderKeys: string[] = [];
    const emptyKeepKeys: string[] = [];
    const variables: PamCliResolvedVarType[] = [];

    for (const variable of source) {
      if (!variable.sensitive) {
        variables.push({
          key: variable.key,
          value: variable.value,
          sensitive: false,
          ...(variable.comments ? { comments: variable.comments } : {})
        });
        continue;
      }

      sensitiveKeys.add(variable.key);

      if (placeholder) {
        placeholderKeys.push(variable.key);
        variables.push({
          key: variable.key,
          value: placeholder,
          sensitive: true,
          ...(variable.comments ? { comments: variable.comments } : {})
        });
        continue;
      }

      emptyKeepKeys.push(variable.key);
      variables.push({
        key: variable.key,
        value: '',
        sensitive: true,
        ...(variable.comments ? { comments: variable.comments } : {})
      });
    }

    return {
      variables,
      sensitiveKeys,
      placeholder,
      placeholderKeys: [...new Set(placeholderKeys)].sort((a, b) =>
        a.localeCompare(b)
      ),
      emptyKeepKeys: [...new Set(emptyKeepKeys)].sort((a, b) =>
        a.localeCompare(b)
      ),
      serverSensitiveKeys
    };
  }

  /**
   * After resolve-by-name, ensure the server returned the requested project.
   */
  public static assertResolvedProjectMatches(
    requestedRef: string,
    projectSlug: string,
    projectId?: string
  ): void {
    const ref = requestedRef.trim();
    if (!ref) {
      return;
    }
    if (PamCliProjectResolveUtil.isLikelyProjectId(ref)) {
      if (projectId && projectId !== ref) {
        throw new Error(
          PamCliI18n.t(PAMENV_CLI_RUN_PROJECT_MISMATCH, {
            ref,
            slug: projectSlug
          })
        );
      }
      return;
    }
    if (projectSlug !== ref) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_RUN_PROJECT_MISMATCH, {
          ref,
          slug: projectSlug
        })
      );
    }
  }

  /**
   * True when the API error is a hard auth denial (must not fall back).
   */
  public static isAuthDenied(error: unknown): boolean {
    return (
      error instanceof PamCliApiError &&
      (error.httpStatus === 401 || error.httpStatus === 403)
    );
  }

  protected static assertPermissionsPresent(
    project: PamCliProjectType
  ): void {
    const keys = project.permissions ?? project.org_permissions;
    if (!Array.isArray(keys)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_PERMISSIONS_MISSING, { slug: project.slug })
      );
    }
  }
}
