import { sessionHasPermission } from '../../shared/permissions/sessionPermissions';
import type { PermissionService } from '../services/PermissionService';
import type {
  BootstrapServerContext,
  BootstrapServerPlugin
} from '@qlover/next-kit/server';

export type PermissionPluginIOC = BootstrapServerContext['parameters']['IOC'];

export type PermissionSessionUser = { id?: unknown } & Record<string, unknown>;

/**
 * Route-layer gate for an immutable permission_key.
 *
 * Flow: load registry -> optional scoped check -> session fast path -> DB.
 * Apps provide the IOC lookups and the "not authorized" error.
 */
export abstract class RequirePermissionPluginBase
  implements BootstrapServerPlugin
{
  public readonly pluginName: string = 'RequirePermissionPlugin';

  constructor(protected readonly permissionKey: string) {}

  protected abstract getPermissionService(
    IOC: PermissionPluginIOC
  ): PermissionService;

  protected abstract getSessionUser(
    IOC: PermissionPluginIOC
  ): Promise<PermissionSessionUser | null>;

  /** Platform permissions of the user from the DB (session was too thin). */
  protected abstract resolveUserPermissions(
    IOC: PermissionPluginIOC,
    userId: string
  ): Promise<readonly string[]>;

  protected abstract createNotAuthorizedError(): Error;

  /**
   * Scoped (e.g. project / team) check. Return `true` when handled; throw to
   * deny. Default: not scoped.
   */
  protected async checkScoped(_IOC: PermissionPluginIOC): Promise<boolean> {
    return false;
  }

  /** `null` = session cannot decide, fall back to the DB. */
  protected checkSession(
    user: PermissionSessionUser,
    service: PermissionService
  ): boolean | null {
    return sessionHasPermission(user, this.permissionKey, (role) =>
      service.getRegistry().resolve(role)
    );
  }

  /**
   * @override
   */
  public async onBefore({
    parameters: { IOC }
  }: BootstrapServerContext): Promise<void> {
    const service = this.getPermissionService(IOC);
    await service.ensureLoaded();

    if (await this.checkScoped(IOC)) {
      return;
    }

    const user = await this.getSessionUser(IOC);
    if (!user?.id) {
      throw this.createNotAuthorizedError();
    }

    const fromSession = this.checkSession(user, service);
    if (fromSession === true) {
      return;
    }
    if (fromSession === false) {
      throw this.createNotAuthorizedError();
    }

    const permissions = await this.resolveUserPermissions(IOC, String(user.id));
    if (!permissions.includes(this.permissionKey)) {
      throw this.createNotAuthorizedError();
    }
  }
}
