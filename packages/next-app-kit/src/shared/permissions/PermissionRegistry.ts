export type RolePermissionMap = Record<string, readonly string[]>;

export interface PermissionRegistryOptions {
  /** Code fallbacks used until (or when) DB assignments are loaded. */
  readonly defaults?: RolePermissionMap;
  /**
   * Legacy / shorthand role keys resolved through another key, e.g.
   * `{ owner: 'team_owner' }`. Only consulted when the key itself has no
   * loaded or default entry.
   */
  readonly aliases?: Record<string, string>;
}

/**
 * In-memory role_key -> permission_key[] map.
 *
 * Keep one instance per process (module scope): server IOC containers are
 * per-request and would otherwise reload the DB on every call.
 */
export class PermissionRegistry {
  protected roleMaps: RolePermissionMap | null = null;

  constructor(protected readonly options: PermissionRegistryOptions = {}) {}

  public setRoleMaps(maps: RolePermissionMap): void {
    this.roleMaps = { ...maps };
  }

  public clear(): void {
    this.roleMaps = null;
  }

  public isLoaded(): boolean {
    return this.roleMaps != null;
  }

  public getDefaults(): RolePermissionMap {
    return { ...(this.options.defaults ?? {}) };
  }

  public resolve(roleKey: string): readonly string[] {
    const direct = this.lookup(roleKey);
    if (direct) {
      return direct;
    }
    const alias = this.options.aliases?.[roleKey];
    if (alias && alias !== roleKey) {
      return this.lookup(alias) ?? [];
    }
    return [];
  }

  public has(roleKey: string, permissionKey: string): boolean {
    return this.resolve(roleKey).includes(permissionKey);
  }

  protected lookup(roleKey: string): readonly string[] | undefined {
    return this.roleMaps?.[roleKey] ?? this.options.defaults?.[roleKey];
  }
}
