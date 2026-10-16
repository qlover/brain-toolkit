import type { PamCliProjectType } from '../../src/interfaces/PamCliTypes';
import type { PamCliMockExportPayloadType } from './PamCliMockPamServer';

export const OWNER_PERMS = [
  'pam_environments_export',
  'pam_environments_inject',
  'pam_project_edit',
  'pam_environments_delete'
] as const;

export const MEMBER_PERMS = [
  'pam_environments_inject',
  'pam_project_edit'
] as const;

export const INJECT_ONLY_PERMS = ['pam_environments_inject'] as const;

export const PLACEHOLDER = '__PAM_SENSITIVE_deadbeef__';

export function ownerProject(
  overrides?: Partial<PamCliProjectType>
): PamCliProjectType {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'fe-base',
    name: 'FE Base',
    my_role: 'owner',
    permissions: [...OWNER_PERMS],
    environments: [
      { id: 'e-dev', name: 'dev' },
      { id: 'e-staging', name: 'staging' }
    ],
    ...overrides
  };
}

export function memberProject(
  overrides?: Partial<PamCliProjectType>
): PamCliProjectType {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'pam',
    name: 'PAM',
    my_role: 'member',
    permissions: [...MEMBER_PERMS],
    environments: [
      { id: 'e-pam-dev', name: 'dev' },
      { id: 'e-pam-secret', name: 'secret' }
    ],
    ...overrides
  };
}

export function ambiguousProjects(): PamCliProjectType[] {
  return [
    memberProject(),
    {
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'pamenv-v2-test-project',
      name: 'Pamenv Test',
      my_role: 'owner',
      permissions: [...OWNER_PERMS],
      environments: [{ id: 'e-test-dev', name: 'dev' }]
    }
  ];
}

export function projectWithoutPermissions(): PamCliProjectType {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'legacy-app',
    name: 'Legacy',
    my_role: 'admin',
    can_edit: true,
    environments: [{ id: 'e-legacy', name: 'dev' }]
  };
}

export function okExport(
  project: PamCliProjectType,
  envId: string,
  envName: string,
  extra?: Partial<PamCliMockExportPayloadType>
): PamCliMockExportPayloadType {
  return {
    projectId: project.id,
    projectSlug: project.slug,
    environmentId: envId,
    environmentName: envName,
    content: `API_URL=https://x.dev\nTOKEN=${PLACEHOLDER}\n`,
    sensitiveKeys: ['TOKEN'],
    sensitivePlaceholder: PLACEHOLDER,
    variables: [
      { key: 'API_URL', value: 'https://x.dev', sensitive: false },
      { key: 'TOKEN', value: PLACEHOLDER, sensitive: true }
    ],
    ...extra
  };
}

export function leakedExport(
  project: PamCliProjectType,
  envId: string,
  envName: string
): PamCliMockExportPayloadType {
  return {
    ...okExport(project, envId, envName),
    variables: [
      { key: 'API_URL', value: 'https://x.dev', sensitive: false },
      { key: 'TOKEN', value: 'leaked-secret', sensitive: true }
    ]
  };
}

/**
 * Builds an export payload from a plain key→value map (for sync drift tests).
 */
export function exportFromMap(
  project: PamCliProjectType,
  envId: string,
  envName: string,
  values: Readonly<Record<string, string>>,
  sensitiveKeys: readonly string[] = ['TOKEN']
): PamCliMockExportPayloadType {
  const sensitive = new Set(sensitiveKeys);
  const variables = Object.keys(values)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({
      key,
      value: values[key]!,
      sensitive: sensitive.has(key)
    }));
  const content = variables
    .map((item) => `${item.key}=${item.value}`)
    .join('\n');
  return {
    projectId: project.id,
    projectSlug: project.slug,
    environmentId: envId,
    environmentName: envName,
    content: `${content}\n`,
    sensitiveKeys: [...sensitiveKeys],
    sensitivePlaceholder: PLACEHOLDER,
    variables
  };
}
