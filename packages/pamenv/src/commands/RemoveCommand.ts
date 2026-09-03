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
      throw new Error(
        'Environment name is required. Use `-e <name>`, for example: pamenv remove <slug> -e local'
      );
    }

    const project = await PamCliProjectResolveUtil.resolve(
      this.apiClient,
      projectRef
    );

    if (!PamCliProjectAccessUtil.canManage(project)) {
      throw new Error(
        `You do not have admin access to project "${project.slug}". Removing an environment requires admin.`
      );
    }

    const env = PamCliEnvironmentSelectUtil.select(
      project.environments,
      envName,
      project.slug
    );

    if (!options.yes) {
      const first = await PamCliConfirmUtil.ask(
        `Delete environment "${env.name}" on project ${project.slug}? This cannot be undone.`
      );
      if (!first) {
        console.log('Cancelled.');
        return;
      }

      const second = await PamCliConfirmUtil.ask(
        `Really delete ${project.slug}/${env.name}?`
      );
      if (!second) {
        console.log('Cancelled.');
        return;
      }
    }

    await this.apiClient.deleteEnvironment(project.id, env.id);
    await this.syncStore.clearSnapshot(project.id, env.name);

    console.log(`Deleted successfully: ${project.slug}/${env.name}`);
  }
}
