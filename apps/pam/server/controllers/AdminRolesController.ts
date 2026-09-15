import { inject, injectable } from '@shared/container';
import {
  pamAdminRoleAssignmentsPatchSchema,
  type PamAdminRolesResponse
} from '@schemas/PamRoleSchema';
import { PamPermissionService } from '@server/services/PamPermissionService';

@injectable()
export class AdminRolesController {
  constructor(
    @inject(PamPermissionService)
    protected readonly permissions: PamPermissionService
  ) {}

  public async list(): Promise<PamAdminRolesResponse> {
    return this.permissions.getAdminRolesView();
  }

  public async replaceAssignments(
    body: unknown
  ): Promise<PamAdminRolesResponse> {
    const parsed = pamAdminRoleAssignmentsPatchSchema.parse(body);
    return this.permissions.replaceRoleAssignments({
      scope: parsed.scope,
      roleKey: parsed.roleKey,
      permissionUids: parsed.permissionUids
    });
  }
}
