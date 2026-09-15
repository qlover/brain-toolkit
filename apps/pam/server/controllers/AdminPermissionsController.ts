import { inject, injectable } from '@shared/container';
import {
  pamAdminPermissionCreateSchema,
  pamAdminPermissionUpdateSchema,
  type PamAdminPermissionsResponse
} from '@schemas/PamRoleSchema';
import { PamPermissionService } from '@server/services/PamPermissionService';

@injectable()
export class AdminPermissionsController {
  constructor(
    @inject(PamPermissionService)
    protected readonly permissions: PamPermissionService
  ) {}

  public async list(): Promise<PamAdminPermissionsResponse> {
    return this.permissions.listPermissionCatalog();
  }

  public async create(body: unknown): Promise<PamAdminPermissionsResponse> {
    const parsed = pamAdminPermissionCreateSchema.parse(body);
    return this.permissions.createPermission(parsed);
  }

  public async update(body: unknown): Promise<PamAdminPermissionsResponse> {
    const parsed = pamAdminPermissionUpdateSchema.parse(body);
    return this.permissions.updatePermission(parsed);
  }
}
