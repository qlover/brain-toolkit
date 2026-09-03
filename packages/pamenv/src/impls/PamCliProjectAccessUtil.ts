import type { PamCliProjectType } from '../interfaces/PamCliTypes';

/**
 * Project write / manage access for pamenv.
 * Prefer PAM collaborator flags; fall back to is_owner.
 */
export class PamCliProjectAccessUtil {
  public static canEdit(project: PamCliProjectType): boolean {
    if (project.can_edit === true) {
      return true;
    }
    return project.is_owner === true;
  }

  /** Admin+ — delete environments / manage project structure. */
  public static canManage(project: PamCliProjectType): boolean {
    if (project.can_manage_collaborators === true) {
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
