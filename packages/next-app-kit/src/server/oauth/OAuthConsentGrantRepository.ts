import type { SupabaseAdminBridge } from '../repositorys/RolePermissionsRepository';

export type OAuthConsentGrantRow = {
  user_id: string;
  client_id: string;
  device_id: string;
  scopes: string[];
  expires_at: string;
  user_agent?: string | null;
  last_used_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UpsertOAuthConsentGrantInput = {
  user_id: string;
  client_id: string;
  device_id: string;
  scopes: string[];
  expires_at: string;
  user_agent?: string | null;
};

/**
 * Remembered consent rows keyed by (user_id, client_id, device_id).
 */
export class OAuthConsentGrantRepository {
  constructor(
    protected readonly supabaseBridge: SupabaseAdminBridge,
    protected readonly tableName: string
  ) {}

  public async find(
    userId: string,
    clientId: string,
    deviceId: string
  ): Promise<OAuthConsentGrantRow | null> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .eq('device_id', deviceId)
      .maybeSingle();
    this.supabaseBridge.throwIfError(result);
    return (result.data as OAuthConsentGrantRow | null) ?? null;
  }

  public async upsert(input: UpsertOAuthConsentGrantInput): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.tableName)
      .upsert(
        { ...input, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,client_id,device_id' }
      );
    this.supabaseBridge.throwIfError(result);
  }

  public async touch(
    userId: string,
    clientId: string,
    deviceId: string
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    const result = await supabase
      .from(this.tableName)
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('client_id', clientId)
      .eq('device_id', deviceId);
    this.supabaseBridge.throwIfError(result);
  }

  public async revoke(
    userId: string,
    clientId: string,
    deviceId?: string
  ): Promise<void> {
    const supabase = await this.supabaseBridge.getAdminSupabase();
    let query = supabase
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .eq('client_id', clientId);
    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }
    const result = await query;
    this.supabaseBridge.throwIfError(result);
  }
}
