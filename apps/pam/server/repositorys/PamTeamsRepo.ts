import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { PamTeamRow } from '@schemas/PamTeamSchema';
import type { LoggerInterface } from '@qlover/logger';

const TABLE = 'pam_role_teams';

@injectable()
export class PamTeamsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  public async findById(teamId: string): Promise<PamTeamRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', teamId)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) {
      this.logger.error('PamTeamsRepo.findById', error);
      throw error;
    }
    return (data as PamTeamRow | null) ?? null;
  }

  public async findBySlug(slug: string): Promise<PamTeamRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) {
      this.logger.error('PamTeamsRepo.findBySlug', error);
      throw error;
    }
    return (data as PamTeamRow | null) ?? null;
  }

  public async listByIds(teamIds: string[]): Promise<PamTeamRow[]> {
    if (teamIds.length === 0) {
      return [];
    }
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('id', teamIds)
      .eq('is_deleted', 0);

    if (error) {
      this.logger.error('PamTeamsRepo.listByIds', error);
      throw error;
    }
    return (data ?? []) as PamTeamRow[];
  }

  public async create(input: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<PamTeamRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        name: input.name,
        slug: input.slug,
        owner_id: input.ownerId
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error('PamTeamsRepo.create', error);
      throw error;
    }
    return data as PamTeamRow;
  }

  public async softDelete(teamId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .update({ is_deleted: 1 })
      .eq('id', teamId);

    if (error) {
      this.logger.error('PamTeamsRepo.softDelete', error);
      throw error;
    }
  }
}
