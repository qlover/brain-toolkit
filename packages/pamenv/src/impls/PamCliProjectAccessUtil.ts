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

  /** Strict project owner (`--mine`). */
  public static isOwner(project: PamCliProjectType): boolean {
    return project.my_role === 'owner' || project.is_owner === true;
  }

  /** Can edit project / env structure (`--writable`, includes team writers). */
  public static isWritable(project: PamCliProjectType): boolean {
    if (this.canEdit(project)) {
      return true;
    }
    return project.can_edit === true || this.isOwner(project);
  }

  /**
   * Compact identity for `pamenv projects` (not a web card dump).
   * e.g. `owner` | `member, writable` | `readonly`
   */
  public static roleLabel(project: PamCliProjectType): string {
    if (this.isOwner(project)) {
      return 'owner';
    }
    if (project.my_role === 'admin') {
      return this.isWritable(project) ? 'admin, writable' : 'admin';
    }
    if (project.my_role === 'member' || project.can_edit === true) {
      return this.isWritable(project) ? 'member, writable' : 'member';
    }
    if (this.isWritable(project)) {
      return 'writable';
    }
    return 'readonly';
  }
}
