import type { PamCliProjectType } from '../interfaces/PamCliTypes';

const ENV_DELETE_PERMISSION = 'pam_environments_delete';
const PROJECT_EDIT_PERMISSION = 'pam_project_edit';

function hasPermission(
  project: PamCliProjectType,
  permissionKey: string
): boolean {
  const keys = project.permissions ?? project.org_permissions;
  return Array.isArray(keys) && keys.includes(permissionKey);
}

/**
 * Project write / manage access for pamenv (team membership flags from PAM).
 */
export class PamCliProjectAccessUtil {
  public static canEdit(project: PamCliProjectType): boolean {
    if (hasPermission(project, PROJECT_EDIT_PERMISSION)) {
      return true;
    }
    if (project.can_edit === true) {
      return true;
    }
    return project.is_owner === true;
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
