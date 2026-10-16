import { resolve } from 'node:path';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_NOT_OWNER_EXPORT,
  PAMENV_CLI_ONLY_MISSING,
  PAMENV_CLI_RENDER_BAD_FORMAT,
  PAMENV_CLI_RENDER_SENSITIVE_OMITTED,
  PAMENV_CLI_RENDER_SENSITIVE_PLACEHOLDER,
  PAMENV_CLI_RENDERED
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliResolvedVarType } from '../interfaces/PamCliTypes';
import { PamCliDotenvUtil } from '../impls/PamCliDotenvUtil';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliOutputAdapterRegistry } from '../impls/PamCliOutputAdapters';
import { PamCliPrivateFsUtil } from '../impls/PamCliPrivateFsUtil';
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';

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
  constructor(protected readonly apiClient: PamCliApiClientInterface) {}

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

    const project = await PamCliProjectResolveUtil.resolve(
      this.apiClient,
      projectRef
    );
    if (!PamCliProjectAccessUtil.canExport(project)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_NOT_OWNER_EXPORT, { slug: project.slug })
      );
    }

    const env = PamCliEnvironmentSelectUtil.select(
      project.environments,
      options.envName,
      project.slug
    );
    const exported = await this.apiClient.exportEnvironment(project.id, env.id);
    const sensitiveKeys = new Set(exported.sensitiveKeys ?? []);
    const source =
      exported.variables && exported.variables.length > 0
        ? exported.variables
        : PamCliDotenvUtil.parse(exported.content);
    let variables: PamCliResolvedVarType[] = source.map((variable) => ({
      key: variable.key,
      value: variable.value,
      sensitive: variable.sensitive === true || sensitiveKeys.has(variable.key),
      ...(variable.comments ? { comments: variable.comments } : {})
    }));

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

    const sensitive = variables
      .filter((variable) => variable.sensitive)
      .map((variable) => variable.key);
    if (sensitive.length > 0) {
      const placeholder = exported.sensitivePlaceholder;
      // Older servers send empty values without a placeholder: omit instead.
      if (placeholder) {
        variables = variables.map((variable) =>
          variable.sensitive ? { ...variable, value: placeholder } : variable
        );
      } else {
        variables = variables.filter((variable) => !variable.sensitive);
      }
      console.error(
        PamCliI18n.t(
          placeholder
            ? PAMENV_CLI_RENDER_SENSITIVE_PLACEHOLDER
            : PAMENV_CLI_RENDER_SENSITIVE_OMITTED,
          { count: String(sensitive.length), keys: sensitive.join(', ') }
        )
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
