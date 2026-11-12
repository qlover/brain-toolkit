import { z } from 'zod';

/**
 * 用户反馈分类。
 */
export const PamUserFeedbackCategory = {
  bug: 'bug',
  ux: 'ux',
  feature: 'feature',
  performance: 'performance',
  content: 'content',
  other: 'other'
} as const;

export type PamUserFeedbackCategoryType =
  (typeof PamUserFeedbackCategory)[keyof typeof PamUserFeedbackCategory];

export const PAM_USER_FEEDBACK_CATEGORIES: readonly PamUserFeedbackCategoryType[] =
  Object.freeze([
    PamUserFeedbackCategory.bug,
    PamUserFeedbackCategory.ux,
    PamUserFeedbackCategory.feature,
    PamUserFeedbackCategory.performance,
    PamUserFeedbackCategory.content,
    PamUserFeedbackCategory.other
  ]);

export const pamUserFeedbackCategorySchema = z.enum([
  PamUserFeedbackCategory.bug,
  PamUserFeedbackCategory.ux,
  PamUserFeedbackCategory.feature,
  PamUserFeedbackCategory.performance,
  PamUserFeedbackCategory.content,
  PamUserFeedbackCategory.other
]);

/**
 * 反馈 → GitHub Issue 同步状态。
 */
export const PamUserFeedbackGithubSyncStatus = {
  pending: 'pending',
  synced: 'synced',
  failed: 'failed',
  skipped: 'skipped'
} as const;

export type PamUserFeedbackGithubSyncStatusType =
  (typeof PamUserFeedbackGithubSyncStatus)[keyof typeof PamUserFeedbackGithubSyncStatus];

export const pamUserFeedbackGithubSyncStatusSchema = z.enum([
  PamUserFeedbackGithubSyncStatus.pending,
  PamUserFeedbackGithubSyncStatus.synced,
  PamUserFeedbackGithubSyncStatus.failed,
  PamUserFeedbackGithubSyncStatus.skipped
]);

export const PamFeedbackDeviceKind = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
  unknown: 'unknown'
} as const;

export type PamFeedbackDeviceKindType =
  (typeof PamFeedbackDeviceKind)[keyof typeof PamFeedbackDeviceKind];

export const PamFeedbackRuntime = {
  browser: 'browser',
  pwa: 'pwa',
  inAppBrowser: 'in_app_browser',
  nativeApp: 'native_app'
} as const;

export type PamFeedbackRuntimeType =
  (typeof PamFeedbackRuntime)[keyof typeof PamFeedbackRuntime];

export const pamFeedbackDeviceSchema = z.object({
  kind: z.enum([
    PamFeedbackDeviceKind.mobile,
    PamFeedbackDeviceKind.tablet,
    PamFeedbackDeviceKind.desktop,
    PamFeedbackDeviceKind.unknown
  ]),
  runtime: z.enum([
    PamFeedbackRuntime.browser,
    PamFeedbackRuntime.pwa,
    PamFeedbackRuntime.inAppBrowser,
    PamFeedbackRuntime.nativeApp
  ]),
  osName: z.string().trim().max(40),
  osVersion: z.string().trim().max(40),
  browserName: z.string().trim().max(40),
  browserVersion: z.string().trim().max(40),
  hostApp: z.string().trim().max(40),
  model: z.string().trim().max(80)
});

export type PamFeedbackDeviceType = z.infer<typeof pamFeedbackDeviceSchema>;

export const PamUserFeedbackStatus = {
  open: 'open',
  reviewing: 'reviewing',
  resolved: 'resolved',
  closed: 'closed'
} as const;

export type PamUserFeedbackStatusType =
  (typeof PamUserFeedbackStatus)[keyof typeof PamUserFeedbackStatus];

export const pamUserFeedbackStatusSchema = z.enum([
  PamUserFeedbackStatus.open,
  PamUserFeedbackStatus.reviewing,
  PamUserFeedbackStatus.resolved,
  PamUserFeedbackStatus.closed
]);

const pamFeedbackSizeSchema = z.object({
  width: z.number().finite().nonnegative().max(100_000),
  height: z.number().finite().nonnegative().max(100_000)
});

export const pamFeedbackClientWindowSchema = z.object({
  devicePixelRatio: z.number().finite().positive().max(16),
  screen: pamFeedbackSizeSchema,
  viewport: pamFeedbackSizeSchema,
  visualViewport: z
    .object({
      width: z.number().finite().nonnegative().max(100_000),
      height: z.number().finite().nonnegative().max(100_000),
      offsetTop: z.number().finite().max(100_000),
      scale: z.number().finite().positive().max(16)
    })
    .nullable()
});

export const pamFeedbackClientContextSchema = z.object({
  reportedAt: z.string().trim().min(1).max(64),
  timeZone: z.string().trim().max(120),
  language: z.string().trim().max(32),
  platform: z.string().trim().max(120),
  userAgent: z.string().trim().max(1000),
  touch: z.boolean(),
  maxTouchPoints: z.number().int().nonnegative().max(64),
  displayMode: z.enum(['standalone', 'browser']),
  fullscreenEnabled: z.boolean(),
  window: pamFeedbackClientWindowSchema,
  device: pamFeedbackDeviceSchema.optional(),
  meta: z
    .record(
      z.string().max(64),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .default({})
});

export type PamFeedbackClientContextType = z.infer<
  typeof pamFeedbackClientContextSchema
>;

export const pamUserFeedbackCreateBodySchema = z.object({
  category: pamUserFeedbackCategorySchema,
  body: z.string().trim().min(1).max(4000),
  pageUrl: z.string().trim().max(2000).optional(),
  clientContext: pamFeedbackClientContextSchema.optional()
});

export type PamUserFeedbackCreateBodyType = z.infer<
  typeof pamUserFeedbackCreateBodySchema
>;

export const pamUserFeedbackItemPublicSchema = z.object({
  id: z.string().uuid(),
  category: pamUserFeedbackCategorySchema,
  body: z.string(),
  pageUrl: z.string().nullable(),
  status: pamUserFeedbackStatusSchema,
  createdAt: z.string()
});

export type PamUserFeedbackItemPublicType = z.infer<
  typeof pamUserFeedbackItemPublicSchema
>;

export const pamUserFeedbackCreateOkSchema = z.object({
  ok: z.literal(true),
  item: pamUserFeedbackItemPublicSchema
});

export type PamUserFeedbackCreateOkType = z.infer<
  typeof pamUserFeedbackCreateOkSchema
>;

export const pamUserFeedbackListPublicSchema = z.object({
  items: z.array(pamUserFeedbackItemPublicSchema)
});

export type PamUserFeedbackListPublicType = z.infer<
  typeof pamUserFeedbackListPublicSchema
>;

export const pamUserFeedbackScreenshotsOkSchema = z.object({
  ok: z.literal(true),
  screenshotPaths: z.array(z.string().min(1).max(500)).max(3)
});

export type PamUserFeedbackScreenshotsOkType = z.infer<
  typeof pamUserFeedbackScreenshotsOkSchema
>;

export const pamUserFeedbackAdminItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  displayName: z.string(),
  category: pamUserFeedbackCategorySchema,
  body: z.string(),
  pageUrl: z.string().nullable(),
  userAgent: z.string().nullable(),
  clientContext: pamFeedbackClientContextSchema.nullable(),
  screenshotUrls: z.array(z.string().min(1)).max(3),
  status: pamUserFeedbackStatusSchema,
  githubIssueNumber: z.number().int().positive().nullable(),
  githubIssueUrl: z.string().nullable(),
  githubSyncStatus: pamUserFeedbackGithubSyncStatusSchema,
  githubSyncError: z.string().nullable(),
  createdAt: z.string()
});

export type PamUserFeedbackAdminItemType = z.infer<
  typeof pamUserFeedbackAdminItemSchema
>;

export const pamUserFeedbackAdminListSchema = z.object({
  items: z.array(pamUserFeedbackAdminItemSchema)
});

export type PamUserFeedbackAdminListType = z.infer<
  typeof pamUserFeedbackAdminListSchema
>;

export const pamUserFeedbackAdminStatusPatchSchema = z.object({
  id: z.string().uuid(),
  status: pamUserFeedbackStatusSchema
});

export type PamUserFeedbackAdminStatusPatchType = z.infer<
  typeof pamUserFeedbackAdminStatusPatchSchema
>;

export const pamUserFeedbackAdminStatusOkSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
  status: pamUserFeedbackStatusSchema
});

export type PamUserFeedbackAdminStatusOkType = z.infer<
  typeof pamUserFeedbackAdminStatusOkSchema
>;

export const pamUserFeedbackAdminGithubIssueBodySchema = z.object({
  id: z.string().uuid()
});

export type PamUserFeedbackAdminGithubIssueBodyType = z.infer<
  typeof pamUserFeedbackAdminGithubIssueBodySchema
>;

export const pamUserFeedbackAdminGithubIssueOkSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
  githubSyncStatus: pamUserFeedbackGithubSyncStatusSchema,
  githubIssueNumber: z.number().int().nullable(),
  githubIssueUrl: z.string().nullable(),
  githubSyncError: z.string().nullable()
});

export type PamUserFeedbackAdminGithubIssueOkType = z.infer<
  typeof pamUserFeedbackAdminGithubIssueOkSchema
>;

/** Storage / 上传约束 */
export const PAM_FEEDBACK_SCREENSHOT_BUCKET = 'pam-user-feedback' as const;
export const PAM_FEEDBACK_SCREENSHOT_MAX_COUNT = 3 as const;
export const PAM_FEEDBACK_SCREENSHOT_MAX_BYTES = 1_572_864 as const;
