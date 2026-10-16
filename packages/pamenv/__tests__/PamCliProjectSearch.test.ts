import { describe, expect, it } from 'vitest';
import { PamCliProjectAccessUtil } from '../src/impls/PamCliProjectAccessUtil';
import { PamCliProjectSearchUtil } from '../src/impls/PamCliProjectSearchUtil';
import type { PamCliProjectType } from '../src/interfaces/PamCliTypes';
import { OWNER_PERMS, MEMBER_PERMS } from './helpers/PamCliIntegrationFixtures';

describe('PamCliProjectSearchUtil', () => {
  it('buildQuery mirrors web filters/sort/page and server mine/writable', () => {
    const params = PamCliProjectSearchUtil.buildQuery({
      keyword: 'fe',
      category: 'frontend',
      visibility: 'private',
      sortBy: 'updated_at',
      sortOrder: 'asc',
      page: 2,
      pageSize: 10,
      mine: true,
      writable: true,
      view: 'compact'
    });
    expect(params.get('keyword')).toBe('fe');
    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('10');
    expect(params.get('view')).toBe('compact');
    expect(JSON.parse(params.get('filters')!)).toEqual({
      view: 'compact',
      category: 'frontend',
      visibility: 'private',
      mine: true,
      writable: true
    });
    expect(JSON.parse(params.get('sort')!)).toEqual([
      { orderBy: 'is_public', order: 'desc' },
      { orderBy: 'updated_at', order: 'asc' },
      { orderBy: 'id', order: 'asc' }
    ]);
  });

  it('filterByAccess supports mine, writable, and intersection', () => {
    const owned: PamCliProjectType = {
      id: '1',
      slug: 'mine',
      name: 'Mine',
      is_owner: true,
      my_role: 'owner',
      permissions: [...OWNER_PERMS]
    };
    const teamWritable: PamCliProjectType = {
      id: '2',
      slug: 'team',
      name: 'Team',
      my_role: 'member',
      can_edit: true,
      permissions: [...MEMBER_PERMS, 'pam_project_edit']
    };
    const readonly: PamCliProjectType = {
      id: '3',
      slug: 'pub',
      name: 'Public',
      my_role: 'none',
      permissions: []
    };
    const all = [owned, teamWritable, readonly];

    expect(
      PamCliProjectSearchUtil.filterByAccess(all, { mine: true }).map(
        (item) => item.slug
      )
    ).toEqual(['mine']);
    expect(
      PamCliProjectSearchUtil.filterByAccess(all, { writable: true }).map(
        (item) => item.slug
      )
    ).toEqual(['mine', 'team']);
    expect(
      PamCliProjectSearchUtil.filterByAccess(all, {
        mine: true,
        writable: true
      }).map((item) => item.slug)
    ).toEqual(['mine']);
  });
});

describe('PamCliProjectAccessUtil.roleLabel', () => {
  it('keeps compact identity labels', () => {
    expect(
      PamCliProjectAccessUtil.roleLabel({
        id: '1',
        slug: 'a',
        name: 'A',
        is_owner: true,
        my_role: 'owner'
      })
    ).toBe('owner');
    expect(
      PamCliProjectAccessUtil.roleLabel({
        id: '2',
        slug: 'b',
        name: 'B',
        my_role: 'member',
        can_edit: true,
        permissions: [...MEMBER_PERMS, 'pam_project_edit']
      })
    ).toBe('member, writable');
    expect(
      PamCliProjectAccessUtil.roleLabel({
        id: '3',
        slug: 'c',
        name: 'C',
        my_role: 'none'
      })
    ).toBe('readonly');
  });
});
