import { describe, expect, it } from 'vitest';
import {
  PAMProjectEnvKey,
  PAMPublicType,
  type PAMProjectDetail
} from '@schemas/PAMProjectSchema';
import { PAMProjectForkUtil } from '@shared/utils/PAMProjectForkUtil';

const sourceDetail = (): PAMProjectDetail => ({
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'demo',
  name: 'Demo',
  category: 'frontend',
  description: 'desc',
  stack: 'next',
  repo_url: 'https://example.com/repo',
  is_public: PAMPublicType.public,
  is_deleted: 0 as never,
  owner_id: '22222222-2222-2222-2222-222222222222',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  [PAMProjectEnvKey]: [
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'staging',
      url: 'https://staging.example.com',
      variables: [
        {
          id: '44444444-4444-4444-4444-444444444444',
          key: 'SECRET',
          value: 'enc:v1:ciphertext',
          sensitive: true,
          comments: ['# secret']
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          key: 'PUBLIC_URL',
          value: 'https://cdn.example.com',
          sensitive: false
        }
      ]
    }
  ]
});

describe('PAMProjectForkUtil', () => {
  it('builds default slug and name', () => {
    expect(PAMProjectForkUtil.defaultSlug('demo')).toBe('demo-fork');
    expect(PAMProjectForkUtil.defaultSlug('demo-fork')).toBe('demo-fork');
    expect(PAMProjectForkUtil.defaultName('Demo')).toBe('Demo (fork)');
    expect(PAMProjectForkUtil.defaultName('Demo (fork)')).toBe('Demo (fork)');
  });

  it('yields slug collision candidates', () => {
    expect(PAMProjectForkUtil.slugCandidates('demo-fork', 3)).toEqual([
      'demo-fork',
      'demo-fork-2',
      'demo-fork-3'
    ]);
  });

  it('clears sensitive values and drops ids in create payload', () => {
    const payload = PAMProjectForkUtil.buildCreatePayload(sourceDetail(), {
      slug: 'demo-fork',
      name: 'Demo (fork)'
    });

    expect(payload).toMatchObject({
      slug: 'demo-fork',
      name: 'Demo (fork)',
      category: 'frontend',
      description: 'desc',
      stack: 'next',
      repo_url: 'https://example.com/repo',
      is_public: PAMPublicType.private
    });

    expect(payload.environments).toEqual([
      {
        name: 'staging',
        url: 'https://staging.example.com',
        variables: [
          {
            key: 'SECRET',
            value: '',
            sensitive: true,
            comments: ['# secret']
          },
          {
            key: 'PUBLIC_URL',
            value: 'https://cdn.example.com',
            sensitive: false
          }
        ]
      }
    ]);
  });
});
