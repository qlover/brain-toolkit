import type { PamCliProjectType } from '../interfaces/PamCliTypes';

const ENV_DELETE_PERMISSION = 'pam_environments_delete';
const ENV_EXPORT_PERMISSION = 'pam_environments_export';
const ENV_INJECT_PERMISSION = 'pam_environments_inject';
const PROJECT_EDIT_PERMISSION = 'pam_project_edit';

function permissionKeys(
  project: PamCliProjectType
): readonly string[] | undefined {
  const keys = project.permissions ?? project.org_permissions;
  return Array.isArray(keys) ? keys : undefined;
}

function hasPermission(
  project: PamCliProjectType,
  permissionKey: string
): boolean {
  const keys = permissionKeys(project);
  return keys !== undefined && keys.includes(permissionKey);
}

/**
 * Project write / manage access for pamenv (team membership flags from PAM).
 *
 * Fail-closed for export / inject / edit: when `permissions` is absent, deny
 * and require a server that returns the array (re-login / upgrade).
 */
export class PamCliProjectAccessUtil {
  public static canEdit(project: PamCliProjectType): boolean {
    return hasPermission(project, PROJECT_EDIT_PERMISSION);
  }

  /** Admin+ — delete environments / manage project structure. */
  public static canManage(project: PamCliProjectType): boolean {
    if (hasPermission(project, ENV_DELETE_PERMISSION)) {
      return true;
    }
    if (project.my_role === 'admin' || project.my_role === 'owner') {
      return true;
    }
    return project.is_owner === true;
  }

  /** Export without sensitive values (`pull` / `render`): project admin / owner. */
  public static canExport(project: PamCliProjectType): boolean {
    return hasPermission(project, ENV_EXPORT_PERMISSION);
  }

  /** Process injection (`run`): every team role. */
  public static canInject(project: PamCliProjectType): boolean {
    return hasPermission(project, ENV_INJECT_PERMISSION);
  }

  public static roleLabel(project: PamCliProjectType): string {
    if (project.my_role === 'owner' || project.is_owner) {
      return 'owner';
    }
    if (project.my_role === 'admin') {
      return 'admin';
    }
    if (project.my_role === 'member' || project.can_edit) {
      return 'member';
    }
    return '';
  }
}
