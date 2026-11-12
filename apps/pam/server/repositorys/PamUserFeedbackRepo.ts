import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { API_SERVER_ERROR } from '@config/i18n-identifier/api';
import {
  PAM_FEEDBACK_SCREENSHOT_BUCKET,
  PAM_FEEDBACK_SCREENSHOT_MAX_COUNT,
  PamUserFeedbackGithubSyncStatus,
  PamUserFeedbackStatus,
  pamFeedbackClientContextSchema,
  pamUserFeedbackGithubSyncStatusSchema,
  type PamFeedbackClientContextType,
  type PamUserFeedbackAdminItemType,
  type PamUserFeedbackCategoryType,
  type PamUserFeedbackGithubSyncStatusType,
  type PamUserFeedbackItemPublicType,
  type PamUserFeedbackStatusType
} from '@schemas/PamUserFeedbackSchema';

const TABLE = 'pam_user_feedback';

const SELECT_OWN =
  'id,user_id,category,body,page_url,user_agent,client_context,screenshot_paths,status,created_at' as const;

const SELECT_ADMIN =
  'id,user_id,category,body,page_url,user_agent,client_context,screenshot_paths,status,created_at,github_issue_number,github_issue_url,github_sync_status,github_sync_error' as const;

type FeedbackDbRowType = {
  readonly id: string;
  readonly user_id: string;
  readonly category: string;
  readonly body: string;
  readonly page_url: string | null;
  readonly user_agent: string | null;
  readonly client_context: unknown;
  readonly screenshot_paths: string[] | null;
  readonly status: string;
  readonly created_at: string;
};

type FeedbackAdminDbRowType = FeedbackDbRowType & {
  readonly github_issue_number: number | null;
  readonly github_issue_url: string | null;
  readonly github_sync_status: string | null;
  readonly github_sync_error: string | null;
};

export type PamUserFeedbackInsertFieldsType = {
  readonly category: PamUserFeedbackCategoryType;
  readonly body: string;
  readonly pageUrl: string | null;
  readonly userAgent: string | null;
  readonly clientContext: PamFeedbackClientContextType | null;
};

export type PamUserFeedbackGithubSyncFieldsType = {
  readonly status: PamUserFeedbackGithubSyncStatusType;
  readonly issueNumber: number | null;
  readonly issueUrl: string | null;
  readonly error: string | null;
};

export type PamUserFeedbackScreenshotSyncStateType = {
  readonly issueNumber: number | null;
  readonly paths: readonly string[];
  readonly postedCount: number;
};

const GITHUB_SYNC_ERROR_MAX = 500;

/**
 * 用户反馈表读写（service role）。
 */
@injectable()
export class PamUserFeedbackRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  public async insertForUser(
    userId: string,
    fields: PamUserFeedbackInsertFieldsType
  ): Promise<PamUserFeedbackItemPublicType> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        user_id: userId,
        category: fields.category,
        body: fields.body,
        page_url: fields.pageUrl,
        user_agent: fields.userAgent,
        client_context: fields.clientContext,
        screenshot_paths: null,
        status: PamUserFeedbackStatus.open,
        github_sync_status: PamUserFeedbackGithubSyncStatus.pending
      })
      .select(SELECT_OWN)
      .single();
    this.supabaseBridge.throwIfError(result);
    return rowToPublic(result.data as FeedbackDbRowType);
  }

  public async listForUser(
    userId: string
  ): Promise<PamUserFeedbackItemPublicType[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select(SELECT_OWN)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    this.supabaseBridge.throwIfError(result);
    return ((result.data ?? []) as FeedbackDbRowType[]).map(rowToPublic);
  }

  public async findOwnedId(
    feedbackId: string,
    userId: string
  ): Promise<string | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('id')
      .eq('id', feedbackId)
      .eq('user_id', userId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    const row = result.data as { readonly id: string } | null;
    return row?.id ?? null;
  }

  public async updateScreenshotPaths(
    feedbackId: string,
    userId: string,
    paths: readonly string[]
  ): Promise<readonly string[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({
        screenshot_paths: [...paths],
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .eq('user_id', userId)
      .select('screenshot_paths')
      .single();
    this.supabaseBridge.throwIfError(result);
    const row = result.data as { readonly screenshot_paths: string[] | null };
    return row.screenshot_paths ?? [];
  }

  public async listAllForAdmin(
    limit: number = 100
  ): Promise<PamUserFeedbackAdminItemType[]> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select(SELECT_ADMIN)
      .order('created_at', { ascending: false })
      .limit(limit);
    this.supabaseBridge.throwIfError(result);
    const rows = (result.data ?? []) as FeedbackAdminDbRowType[];
    const nameByUserId = await this.loadDisplayNames(
      rows.map((row) => row.user_id)
    );
    const items: PamUserFeedbackAdminItemType[] = [];
    for (const row of rows) {
      const urls = await this.createScreenshotSignedUrls(
        row.screenshot_paths ?? []
      );
      items.push(mapAdminRow(row, urls, nameByUserId.get(row.user_id) ?? null));
    }
    return items;
  }

  public async findByIdAsAdmin(
    feedbackId: string
  ): Promise<PamUserFeedbackAdminItemType | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select(SELECT_ADMIN)
      .eq('id', feedbackId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    const row = result.data as FeedbackAdminDbRowType | null;
    if (!row) {
      return null;
    }
    const [urls, nameByUserId] = await Promise.all([
      this.createScreenshotSignedUrls(row.screenshot_paths ?? []),
      this.loadDisplayNames([row.user_id])
    ]);
    return mapAdminRow(row, urls, nameByUserId.get(row.user_id) ?? null);
  }

  public async updateGithubSyncAsAdmin(
    feedbackId: string,
    fields: PamUserFeedbackGithubSyncFieldsType
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const now = new Date().toISOString();
    const result = await supabase
      .from(TABLE)
      .update({
        github_sync_status: fields.status,
        github_issue_number: fields.issueNumber,
        github_issue_url: fields.issueUrl,
        github_sync_error: fields.error
          ? fields.error.slice(0, GITHUB_SYNC_ERROR_MAX)
          : null,
        github_synced_at:
          fields.status === PamUserFeedbackGithubSyncStatus.synced ? now : null,
        updated_at: now
      })
      .eq('id', feedbackId);
    this.supabaseBridge.throwIfError(result);
  }

  public async updateStatusByIssueNumberAsAdmin(
    issueNumber: number,
    status: PamUserFeedbackStatusType
  ): Promise<number> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('github_issue_number', issueNumber)
      .neq('status', status)
      .select('id');
    this.supabaseBridge.throwIfError(result);
    return (result.data ?? []).length;
  }

  public async updateStatusAsAdmin(
    feedbackId: string,
    status: PamUserFeedbackStatusType
  ): Promise<PamUserFeedbackStatusType | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', feedbackId)
      .select('status')
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    const row = result.data as { readonly status: string } | null;
    return row ? (row.status as PamUserFeedbackStatusType) : null;
  }

  public async uploadScreenshotObject(
    objectPath: string,
    bytes: Buffer,
    contentType: string
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.storage
      .from(PAM_FEEDBACK_SCREENSHOT_BUCKET)
      .upload(objectPath, bytes, {
        contentType,
        upsert: false
      });
    if (result.error) {
      throw new ExecutorError(API_SERVER_ERROR, result.error.message);
    }
  }

  public async findScreenshotSyncStateAsAdmin(
    feedbackId: string
  ): Promise<PamUserFeedbackScreenshotSyncStateType | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('github_issue_number,screenshot_paths,github_screenshot_count')
      .eq('id', feedbackId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    const row = result.data as {
      readonly github_issue_number: number | null;
      readonly screenshot_paths: string[] | null;
      readonly github_screenshot_count: number | null;
    } | null;
    if (!row) {
      return null;
    }
    return {
      issueNumber: row.github_issue_number ?? null,
      paths: row.screenshot_paths ?? [],
      postedCount: row.github_screenshot_count ?? 0
    };
  }

  public async compareAndSetScreenshotCountAsAdmin(
    feedbackId: string,
    from: number,
    to: number
  ): Promise<boolean> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({ github_screenshot_count: to })
      .eq('id', feedbackId)
      .eq('github_screenshot_count', from)
      .select('id');
    this.supabaseBridge.throwIfError(result);
    return (result.data ?? []).length > 0;
  }

  public async downloadScreenshotObject(objectPath: string): Promise<Buffer> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.storage
      .from(PAM_FEEDBACK_SCREENSHOT_BUCKET)
      .download(objectPath);
    if (result.error || !result.data) {
      throw new ExecutorError(
        API_SERVER_ERROR,
        result.error?.message ?? 'screenshot download failed'
      );
    }
    return Buffer.from(await result.data.arrayBuffer());
  }

  public async createScreenshotSignedUrls(
    paths: readonly string[],
    expiresSec: number = 3600
  ): Promise<string[]> {
    if (paths.length === 0) {
      return [];
    }
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const urls: string[] = [];
    for (const path of paths.slice(0, PAM_FEEDBACK_SCREENSHOT_MAX_COUNT)) {
      const result = await supabase.storage
        .from(PAM_FEEDBACK_SCREENSHOT_BUCKET)
        .createSignedUrl(path, expiresSec);
      if (result.error || !result.data?.signedUrl) {
        continue;
      }
      urls.push(result.data.signedUrl);
    }
    return urls;
  }

  protected async loadDisplayNames(
    userIds: readonly string[]
  ): Promise<Map<string, string | null>> {
    const unique = [...new Set(userIds.filter(Boolean))];
    const map = new Map<string, string | null>();
    if (unique.length === 0) {
      return map;
    }
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from('pam_users')
      .select('id,display_name')
      .in('id', unique);
    this.supabaseBridge.throwIfError(result);
    for (const row of (result.data ?? []) as ReadonlyArray<{
      readonly id: string;
      readonly display_name: string | null;
    }>) {
      map.set(row.id, row.display_name);
    }
    return map;
  }
}

function rowToPublic(row: FeedbackDbRowType): PamUserFeedbackItemPublicType {
  return {
    id: row.id,
    category: row.category as PamUserFeedbackCategoryType,
    body: row.body,
    pageUrl: row.page_url,
    status: row.status as PamUserFeedbackStatusType,
    createdAt: row.created_at
  };
}

function mapAdminRow(
  row: FeedbackAdminDbRowType,
  screenshotUrls: readonly string[],
  displayNameRaw: string | null
): PamUserFeedbackAdminItemType {
  const displayName = displayNameRaw?.trim() || row.user_id.slice(0, 8);
  const parsedContext = pamFeedbackClientContextSchema.safeParse(
    row.client_context
  );
  return {
    id: row.id,
    userId: row.user_id,
    displayName,
    category: row.category as PamUserFeedbackCategoryType,
    body: row.body,
    pageUrl: row.page_url,
    userAgent: row.user_agent,
    clientContext: parsedContext.success ? parsedContext.data : null,
    screenshotUrls: [...screenshotUrls],
    status: row.status as PamUserFeedbackStatusType,
    githubIssueNumber: row.github_issue_number ?? null,
    githubIssueUrl: row.github_issue_url ?? null,
    githubSyncStatus: parseGithubSyncStatus(row.github_sync_status),
    githubSyncError: row.github_sync_error ?? null,
    createdAt: row.created_at
  };
}

function parseGithubSyncStatus(
  raw: string | null
): PamUserFeedbackGithubSyncStatusType {
  const parsed = pamUserFeedbackGithubSyncStatusSchema.safeParse(raw);
  return parsed.success ? parsed.data : PamUserFeedbackGithubSyncStatus.skipped;
}
