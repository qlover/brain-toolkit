import { describe, expect, it } from 'vitest';
import { expandOrgPermissions, hasOrgPermission } from '@shared/auth/orgRole';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { TeamRoleKey, teamRoleKeyFromLegacy } from '@shared/auth/roleKeys';

describe('ci_runner org role', () => {
  it('maps legacy ci_runner to team_ci_runner', () => {
    expect(teamRoleKeyFromLegacy('ci_runner')).toBe(TeamRoleKey.CiRunner);
  });

  it('grants inject but not export or edit', () => {
    const keys = expandOrgPermissions('ci_runner');
    expect(keys).toContain(PermissionKey.pam_environments_inject);
    expect(keys).toContain(PermissionKey.pam_teams_read);
    expect(
      hasOrgPermission('ci_runner', PermissionKey.pam_environments_export)
    ).toBe(false);
    expect(hasOrgPermission('ci_runner', PermissionKey.pam_project_edit)).toBe(
      false
    );
  });
});
