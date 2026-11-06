import { SupabaseRepo } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import { PamTables } from '@config/pamTables';
import type {
  PamCiOidcBinding,
  PamCiOidcProviderType
} from '@schemas/PamCiOidcSchema';

type BindingRowType = {
  id: string;
  project_id: string;
  provider: string;
  repository: string;
  ci_user_id: string;
  audience: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * `pam_ci_oidc_bindings` 读写（service role）。
 */
@injectable()
export class PamCiOidcBindingRepo {
  constructor(
    @inject(SupabaseRepo)
    protected readonly supabaseBridge: SupabaseRepo<unknown>
  ) {}

  public async findByProjectProvider(
    projectId: string,
    provider: PamCiOidcProviderType = 'github'
  ): Promise<PamCiOidcBinding | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.ciOidcBindings)
      .select('*')
      .eq('project_id', projectId)
      .eq('provider', provider)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    return result.data ? this.mapRow(result.data as BindingRowType) : null;
  }

  public async findByProviderRepository(
    provider: PamCiOidcProviderType,
    repository: string
  ): Promise<PamCiOidcBinding | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.ciOidcBindings)
      .select('*')
      .eq('provider', provider)
      .eq('repository', repository.trim())
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    return result.data ? this.mapRow(result.data as BindingRowType) : null;
  }

  public async upsert(input: {
    readonly projectId: string;
    readonly provider: PamCiOidcProviderType;
    readonly repository: string;
    readonly ciUserId: string;
    readonly audience: string | null;
    readonly createdBy: string | null;
  }): Promise<PamCiOidcBinding> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.ciOidcBindings)
      .upsert(
        {
          project_id: input.projectId,
          provider: input.provider,
          repository: input.repository.trim(),
          ci_user_id: input.ciUserId,
          audience: input.audience,
          created_by: input.createdBy
        },
        { onConflict: 'project_id,provider' }
      )
      .select('*')
      .single();
    this.supabaseBridge.throwIfError(result);
    return this.mapRow(result.data as BindingRowType);
  }

  public async deleteByProjectProvider(
    projectId: string,
    provider: PamCiOidcProviderType = 'github'
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(PamTables.ciOidcBindings)
      .delete()
      .eq('project_id', projectId)
      .eq('provider', provider);
    this.supabaseBridge.throwIfError(result);
  }

  protected mapRow(row: BindingRowType): PamCiOidcBinding {
    return {
      id: row.id,
      projectId: row.project_id,
      provider: row.provider as PamCiOidcBinding['provider'],
      repository: row.repository,
      ciUserId: row.ci_user_id,
      audience: row.audience,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
