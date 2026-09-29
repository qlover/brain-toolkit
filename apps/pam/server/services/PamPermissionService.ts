import { PermissionService } from '@brain-toolkit/next-app-kit/server';
import { pamPermissionRegistry } from '@shared/auth/permissionRegistry';
import { RoleKind } from '@shared/auth/roleKeys';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type {
  PamAdminRoleItem,
  PamAdminRolesResponse
} from '@schemas/PamRoleSchema';
import { PamRolePermissionsRepo } from '../repositorys/PamRolePermissionsRepo';
import type { LoggerInterface } from '@qlover/logger';

@injectable()
export class PamPermissionService extends PermissionService<PamRolePermissionsRepo> {
  protected readonly registry = pamPermissionRegistry;

  constructor(
    @inject(PamRolePermissionsRepo)
    repo: PamRolePermissionsRepo,
    @inject(I.Logger)
    logger: LoggerInterface
  ) {
    super(repo, logger);
  }

  /**
   * Adds the legacy `system` / `org` maps on top of `roles`.
   *
   * @override
   */
  public override async getAdminRolesView(): Promise<PamAdminRolesResponse> {
    const view = await super.getAdminRolesView();
    const roles = view.roles as PamAdminRoleItem[];

    const system: Record<string, string[]> = {};
    const org: Record<string, string[]> = {};
    for (const role of roles) {
      if (role.kind === RoleKind.Platform) {
        system[role.key] = [...role.permissionKeys];
      } else {
        org[role.key.replace(/^team_/, '')] = [...role.permissionKeys];
      }
    }

    return { catalog: view.catalog, roles, system, org };
  }

  /**
   * @override
   */
  public override async replaceRoleAssignments(input: {
    roleId: string;
    permissionKeys: string[];
  }): Promise<PamAdminRolesResponse> {
    return (await super.replaceRoleAssignments(input)) as PamAdminRolesResponse;
  }
}
