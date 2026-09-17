import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import type { PamTeamRow } from '@schemas/PamTeamSchema';

const TABLE = 'pam_role_teams';

/**
 * PostgREST queries use {@link SupabaseRepo.throwIfError} —
 * remapped errors bubble to {@link NextApiHandler}.
 */
@injectable()
export class PamTeamsRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  public async findById(teamId: string): Promise<PamTeamRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', teamId)
      .eq('is_deleted', 0)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as PamTeamRow | null) ?? null;
  }

  public async findBySlug(slug: string): Promise<PamTeamRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .eq('is_deleted', 0)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);

    return (result.data as PamTeamRow | null) ?? null;
  }

  public async listByIds(teamIds: string[]): Promise<PamTeamRow[]> {
    if (teamIds.length === 0) {
      return [];
    }
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .select('*')
      .in('id', teamIds)
      .eq('is_deleted', 0);
    this.supabaseBridge.throwIfError(result);

    return (result.data ?? []) as PamTeamRow[];
  }

  public async create(input: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<PamTeamRow> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        name: input.name,
        slug: input.slug,
        owner_id: input.ownerId
      })
      .select('*')
      .single();
    this.supabaseBridge.throwIfError(result);

    return result.data as PamTeamRow;
  }

  public async softDelete(teamId: string): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(TABLE)
      .update({ is_deleted: 1 })
      .eq('id', teamId);
    this.supabaseBridge.throwIfError(result);
  }
}
