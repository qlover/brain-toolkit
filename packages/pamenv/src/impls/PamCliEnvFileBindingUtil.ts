import { relative, resolve, sep } from 'node:path';
import { readFile } from 'node:fs/promises';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_ENV_FILE_BOUND_TO_OTHER_PROJECT,
  PAMENV_CLI_FORCE_REBIND_CONFIRM,
  PAMENV_CLI_FORCE_REBIND_NEEDS_TTY
} from '../i18n/identifier/pamenv_cli';
import { PamCliConfirmUtil } from './PamCliConfirmUtil';
import { PamCliPrivateFsUtil } from './PamCliPrivateFsUtil';
import { PamCliLocalEnvFileUtil } from './PamCliLocalEnvFileUtil';

export type PamCliEnvFileBindingType = {
  readonly projectId: string;
  readonly projectSlug: string;
  readonly envName: string;
  readonly updatedAt: string;
};

type PamCliEnvFileBindingsFileType = {
  readonly version: 1;
  readonly files: Record<string, PamCliEnvFileBindingType>;
};

/**
 * Maps local dotenv paths to the PAM project/env that last owned them.
 *
 * Significance: Default `.env.<env>` collides when two projects share an
 * env name in the same cwd (e.g. fe-base/dev and pam/dev).
 * Core idea: Persist bindings under the active `.pam/sync` root; refuse
 * cross-project overwrite unless `--force`.
 */
export class PamCliEnvFileBindingUtil {
  public static readonly BINDINGS_FILE_NAME = 'env-file-bindings.json' as const;

  /**
   * Suggested `--file` when isolating two projects that share an env name.
   *
   * @example
   * toProjectScopedFileName('fe-base', 'dev') // '.env.fe-base.dev'
   */
  public static toProjectScopedFileName(
    projectSlug: string,
    environmentName: string
  ): string {
    const slug = projectSlug.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    const env = environmentName.trim();
    return `.env.${slug}.${env}`;
  }

  /**
   * Stable key relative to `outDir` (posix separators).
   */
  public static toBindingKey(outDir: string, absoluteFilePath: string): string {
    const rel = relative(resolve(outDir), resolve(absoluteFilePath));
    const normalized = rel.split(sep).join('/');
    return normalized || relative(resolve(outDir), resolve(absoluteFilePath));
  }

  public static bindingsPath(syncRoot: string): string {
    return `${syncRoot.replace(/[/\\]+$/, '')}/${this.BINDINGS_FILE_NAME}`;
  }

  public static async readAll(
    syncRoot: string
  ): Promise<PamCliEnvFileBindingsFileType> {
    try {
      const raw = await readFile(this.bindingsPath(syncRoot), 'utf8');
      const parsed = JSON.parse(raw) as PamCliEnvFileBindingsFileType;
      if (parsed.version !== 1 || !parsed.files) {
        return { version: 1, files: {} };
      }
      return parsed;
    } catch {
      return { version: 1, files: {} };
    }
  }

  public static async readBinding(
    syncRoot: string,
    outDir: string,
    absoluteFilePath: string
  ): Promise<PamCliEnvFileBindingType | null> {
    const all = await this.readAll(syncRoot);
    return all.files[this.toBindingKey(outDir, absoluteFilePath)] ?? null;
  }

  /**
   * Blocks using a dotenv file already bound to another project.
   *
   * `--force` still requires an interactive TTY confirmation before rebind.
   *
   * @throws when bound to a different projectId and rebind is not confirmed
   */
  public static async assertCompatibleOrThrow(params: {
    readonly syncRoot: string;
    readonly outDir: string;
    readonly absoluteFilePath: string;
    readonly projectId: string;
    readonly projectSlug: string;
    readonly envName: string;
    readonly force?: boolean;
  }): Promise<void> {
    const existing = await this.readBinding(
      params.syncRoot,
      params.outDir,
      params.absoluteFilePath
    );
    if (!existing || existing.projectId === params.projectId) {
      return;
    }

    const suggested = this.toProjectScopedFileName(
      params.projectSlug,
      params.envName
    );

    if (params.force !== true) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_ENV_FILE_BOUND_TO_OTHER_PROJECT, {
          path: params.absoluteFilePath,
          boundSlug: existing.projectSlug,
          boundEnv: existing.envName,
          slug: params.projectSlug,
          env: params.envName,
          suggestedFile: suggested,
          defaultFile: PamCliLocalEnvFileUtil.toFileName(params.envName)
        })
      );
    }

    if (!process.stdin.isTTY) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_FORCE_REBIND_NEEDS_TTY, {
          path: params.absoluteFilePath,
          boundSlug: existing.projectSlug,
          boundEnv: existing.envName,
          suggestedFile: suggested
        })
      );
    }

    const confirmed = await PamCliConfirmUtil.ask(
      PamCliI18n.t(PAMENV_CLI_FORCE_REBIND_CONFIRM, {
        path: params.absoluteFilePath,
        boundSlug: existing.projectSlug,
        boundEnv: existing.envName,
        slug: params.projectSlug,
        env: params.envName
      })
    );
    if (!confirmed) {
      throw new Error(PamCliI18n.t(PAMENV_CLI_CANCELLED));
    }
  }

  public static async writeBinding(params: {
    readonly syncRoot: string;
    readonly outDir: string;
    readonly absoluteFilePath: string;
    readonly projectId: string;
    readonly projectSlug: string;
    readonly envName: string;
  }): Promise<void> {
    const all = await this.readAll(params.syncRoot);
    const key = this.toBindingKey(params.outDir, params.absoluteFilePath);
    const next: PamCliEnvFileBindingsFileType = {
      version: 1,
      files: {
        ...all.files,
        [key]: {
          projectId: params.projectId,
          projectSlug: params.projectSlug,
          envName: params.envName,
          updatedAt: new Date().toISOString()
        }
      }
    };
    await PamCliPrivateFsUtil.writePrivateFile(
      this.bindingsPath(params.syncRoot),
      `${JSON.stringify(next, null, 2)}\n`
    );
  }
}
