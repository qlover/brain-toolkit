import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CANCELLED,
  PAMENV_CLI_REMOVE_CONFIRM,
  PAMENV_CLI_REMOVE_CONFIRM_AGAIN,
  PAMENV_CLI_REMOVE_DELETED,
  PAMENV_CLI_REMOVE_ENV_REQUIRED,
  PAMENV_CLI_REMOVE_NOT_ADMIN
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import { PamCliConfirmUtil } from '../impls/PamCliConfirmUtil';
import { PamCliEnvironmentSelectUtil } from '../impls/PamCliEnvironmentSelectUtil';
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';
import { PamCliProjectResolveUtil } from '../impls/PamCliProjectResolveUtil';
import { PamCliSyncStore } from '../impls/PamCliSyncStore';

export type PamCliRemoveOptionsType = {
  readonly envName?: string;
  /** Skip both confirmation prompts. */
  readonly yes?: boolean;
};

/**
 * `pamenv remove` — delete one PAM environment from a project.
 *
 * Significance: Lets admins drop a remote env without the web UI.
 * Core idea: Resolve by `-e`, confirm twice, then DELETE via API.
 * Main function: Admin check, dual confirm, delete, clear sync baseline.
 * Main purpose: Safer remote env teardown from the working directory.
 *
 * @example
 * await new RemoveCommand(api).run('my-app', { envName: 'local' });
 */
export class RemoveCommand {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly syncStore: PamCliSyncStore = new PamCliSyncStore()
  ) {}

  /**
   * @param projectRef - Project slug or project id
   * @param options - Requires `-e`; optional `-y` to skip confirms
   */
  public async run(
    projectRef: string,
    options: PamCliRemoveOptionsType = {}
  ): Promise<void> {
    const envName = options.envName?.trim();
    if (!envName) {
      throw new Error(PamCliI18n.t(PAMENV_CLI_REMOVE_ENV_REQUIRED));
    }

    const project = await PamCliProjectResolveUtil.resolve(
      this.apiClient,
      projectRef
    );

    if (!PamCliProjectAccessUtil.canManage(project)) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_REMOVE_NOT_ADMIN, { slug: project.slug })
      );
    }

    const env = PamCliEnvironmentSelectUtil.select(
      project.environments,
      envName,
      project.slug
    );

    if (!options.yes) {
      const first = await PamCliConfirmUtil.ask(
        PamCliI18n.t(PAMENV_CLI_REMOVE_CONFIRM, {
          env: env.name,
          slug: project.slug
        })
      );
      if (!first) {
        console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
        return;
      }

      const second = await PamCliConfirmUtil.ask(
        PamCliI18n.t(PAMENV_CLI_REMOVE_CONFIRM_AGAIN, {
          slug: project.slug,
          env: env.name
        })
      );
      if (!second) {
        console.log(PamCliI18n.t(PAMENV_CLI_CANCELLED));
        return;
      }
    }

    await this.apiClient.deleteEnvironment(project.id, env.id);
    await this.syncStore.clearSnapshot(project.id, env.name);

    console.log(
      PamCliI18n.t(PAMENV_CLI_REMOVE_DELETED, {
        slug: project.slug,
        env: env.name
      })
    );
  }
}
