import { resolve } from 'node:path';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_ONLY_MISSING,
  PAMENV_CLI_RENDER_BAD_FORMAT,
  PAMENV_CLI_RENDER_SENSITIVE_EMPTY,
  PAMENV_CLI_RENDER_SENSITIVE_PLACEHOLDER,
  PAMENV_CLI_RENDERED
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliResolvedVarType } from '../interfaces/PamCliTypes';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliOutputAdapterRegistry } from '../impls/PamCliOutputAdapters';
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliSecurityGate } from '../impls/PamCliSecurityGate';

export type PamCliRenderOptionsType = {
  readonly envName?: string;
  /** `dotenv` (default) | `json` | `yaml` | `toml`. */
  readonly format?: string;
  /** File path; omitted or `-` writes to stdout. */
  readonly out?: string;
  readonly only?: readonly string[];
};

/**
 * `pamenv render` — print or write one environment in a chosen format.
 * Requires export permission; sensitive values are the env placeholder.
 *
 * @example
 * await new RenderCommand(api).run('my-app', { envName: 'dev', format: 'json' });
 */
export class RenderCommand {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly authStore?: PamCliAuthStoreInterface
  ) {}

  public async run(
    projectRef: string,
    options: PamCliRenderOptionsType = {}
  ): Promise<void> {
    const format = (options.format || 'dotenv').trim().toLowerCase();
    if (!PamCliOutputAdapterRegistry.isFormat(format)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_RENDER_BAD_FORMAT, {
          format,
          formats: PamCliOutputAdapterRegistry.formats().join(', ')
        })
      );
    }

    if (this.authStore) {
      await PamCliSecurityGate.assertIdentity(this.authStore);
    }

    const project = await PamCliSecurityGate.resolveProjectExact(
      this.apiClient,
      projectRef
    );
    PamCliSecurityGate.assertCanExport(project);

    const env = PamCliEnvironmentSelectUtil.select(
      project.environments,
      options.envName,
      project.slug
    );
    const exported = await this.apiClient.exportEnvironment(project.id, env.id);
    // Force placeholders / omit — never emit sensitive plaintext (incl. leaky exports).
    const redacted = PamCliSecurityGate.redactExportForLocalOutput(exported);
    let variables: PamCliResolvedVarType[] = [...redacted.variables];

    if (options.only && options.only.length > 0) {
      const only = new Set(options.only);
      variables = variables.filter((variable) => only.has(variable.key));
      const returned = new Set(variables.map((variable) => variable.key));
      const missing = options.only.filter((key) => !returned.has(key));
      if (missing.length > 0) {
        console.error(
          PamCliI18n.t(PAMENV_CLI_ONLY_MISSING, { keys: missing.join(', ') })
        );
      }
    }

    if (redacted.placeholderKeys.length > 0) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_RENDER_SENSITIVE_PLACEHOLDER, {
          count: String(redacted.placeholderKeys.length),
          keys: redacted.placeholderKeys.join(', ')
        })
      );
    } else if (redacted.emptyKeepKeys.length > 0) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_RENDER_SENSITIVE_EMPTY, {
          count: String(redacted.emptyKeepKeys.length),
          keys: redacted.emptyKeepKeys.join(', ')
        })
      );
    }

    const text = PamCliOutputAdapterRegistry.get(format).serialize(variables);
    const out = options.out?.trim();
    if (!out || out === '-') {
      process.stdout.write(text);
      return;
    }

    const target = resolve(out);
    await PamCliPrivateFsUtil.writePrivateFile(target, text);
    console.error(
      PamCliI18n.t(PAMENV_CLI_RENDERED, {
        slug: project.slug,
        env: env.name,
        format,
        count: String(variables.length),
        path: target
      })
    );
  }
}
