import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import type {
  PamMailLogAdminItem,
  PamMailLogRow,
  PamMailProvider,
  PamMailStatus,
  PamMailTemplate
} from '@schemas/PamMailSchema';

const TABLE = 'pam_mail_logs';

function mapAdminItem(row: PamMailLogRow): PamMailLogAdminItem {
  return {
    id: row.id,
    toEmail: row.to_email,
    subject: row.subject,
    template: row.template,
    provider: row.provider,
    status: row.status,
    providerMessageId: row.provider_message_id ?? null,
    error: row.error ?? null,
    bodyText: row.body_text ?? null,
    userId: row.user_id ?? null,
    createdIp: row.created_ip ?? null,
    createdAt: row.created_at
  };
}

@injectable()
export class PamMailLogsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  public async insert(input: {
    toEmail: string;
    subject: string;
    template: PamMailTemplate;
    provider: PamMailProvider;
    status: PamMailStatus;
    providerMessageId?: string | null;
    error?: string | null;
    bodyText?: string | null;
    userId?: string | null;
    createdIp?: string | null;
  }): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase.from(TABLE).insert({
      to_email: input.toEmail,
      subject: input.subject,
      template: input.template,
      provider: input.provider,
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
      error: input.error ?? null,
      body_text: input.bodyText ?? null,
      user_id: input.userId ?? null,
      created_ip: input.createdIp ?? null
    });
    this.supabaseBridge.throwIfError(result);
  }

  public async listRecent(params: {
    limit?: number;
    email?: string;
    template?: PamMailTemplate;
  }): Promise<PamMailLogAdminItem[]> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
    const supabase = await this.supabaseBridge.getAdminSupabase();
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    const email = params.email?.trim();
    if (email) {
      query = query.ilike('to_email', `%${email}%`);
    }
    if (params.template) {
      query = query.eq('template', params.template);
    }

    const result = await query;
    this.supabaseBridge.throwIfError(result);

    return ((result.data as PamMailLogRow[]) ?? []).map(mapAdminItem);
  }

  public async countRecentByEmail(
    email: string,
    template: PamMailTemplate,
    sinceIso: string
  ): Promise<number> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('to_email', email)
      .eq('template', template)
      .gte('created_at', sinceIso);
    this.supabaseBridge.throwIfError(result);
    return result.count ?? 0;
  }
}
