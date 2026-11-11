import { describe, expect, it } from 'vitest';
import { isTeamMembershipEffective } from '@schemas/PamTeamSchema';

describe('isTeamMembershipEffective', () => {
  const owner = '308c658e-a3c8-4684-89d4-9c6211134abc';
  const other = '66edd6c4-1f89-4481-a13d-20f29e9d733f';

  it('grants own personal team', () => {
    expect(isTeamMembershipEffective(`personal-${owner}`, owner)).toBe(true);
  });

  it('ignores membership in another user personal team', () => {
    expect(isTeamMembershipEffective(`personal-${owner}`, other)).toBe(false);
  });

  it('allows CI Runner on another user personal team', () => {
    expect(
      isTeamMembershipEffective(`personal-${owner}`, other, 'team_ci_runner')
    ).toBe(true);
    expect(
      isTeamMembershipEffective(`personal-${owner}`, other, 'ci_runner')
    ).toBe(true);
  });

  it('still denies non-CI roles on another user personal team', () => {
    expect(
      isTeamMembershipEffective(`personal-${owner}`, other, 'team_member')
    ).toBe(false);
  });

  it('grants named teams', () => {
    expect(isTeamMembershipEffective('brain-test', other)).toBe(true);
  });

  it('denies when team slug is unknown', () => {
    expect(isTeamMembershipEffective(null, owner)).toBe(false);
    expect(isTeamMembershipEffective(undefined, owner)).toBe(false);
  });
});
