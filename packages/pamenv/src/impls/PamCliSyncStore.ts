import { readFile, rm } from 'node:fs/promises';
import { PamCliConfig } from '../config/PamCliConfig';
import {
  createPamCliRuntimeContext,
  type PamCliRuntimeContextType
} from '../config/PamCliRuntimeContext';
import { PamCliPrivateFsUtil } from './PamCliPrivateFsUtil';

/**
 * Last-synced key/value snapshot for three-way push conflict detection.
 */
export type PamCliSyncSnapshotType = {
  readonly version: 1;
  readonly projectId: string;
  readonly projectSlug: string;
  readonly envName: string;
  readonly updatedAt: string;
  readonly variables: Readonly<Record<string, string>>;
};

/**
 * Disk store for pamenv sync baselines under `~/.pam/sync` or local `.pam/sync`.
 *
 * Significance: Remembers the last successful pull/push for conflict checks.
 * Core idea: One JSON snapshot per project id + environment name (`0600`).
 * Main function: Read/write semantic key→value maps; wipe on logout.
 * Main purpose: Detect remote-only and divergent edits on `pamenv push`.
 *
 * @example
 * const store = new PamCliSyncStore({ preferLocal: true, workingDir: process.cwd() });
 * await store.writeSnapshot(snapshot);
 */
export class PamCliSyncStore {
  protected runtime: PamCliRuntimeContextType;

  constructor(runtime?: Partial<PamCliRuntimeContextType>) {
    this.runtime = createPamCliRuntimeContext(runtime);
  }

  /**
   * @param workingDir - Directory used when `--local` is active
   */
  public setWorkingDir(workingDir: string): void {
    this.runtime = {
      ...this.runtime,
      workingDir
    };
  }

  /**
   * @param projectId - Project uuid
   * @param envName - Environment name
   */
  public getSnapshotPath(projectId: string, envName: string): string {
    if (this.runtime.preferLocal) {
      return PamCliConfig.getLocalSyncSnapshotPath(
        this.runtime.workingDir,
        projectId,
        envName
      );
    }
    return PamCliConfig.getSyncSnapshotPath(projectId, envName);
  }

  protected getSyncRoot(): string {
    return this.runtime.preferLocal
      ? PamCliConfig.getLocalSyncRoot(this.runtime.workingDir)
      : PamCliConfig.getSyncRoot();
  }

  /**
   * @param projectId - Project uuid
   * @param envName - Environment name
   * @returns Snapshot or null when missing / invalid
   */
  public async readSnapshot(
    projectId: string,
    envName: string
  ): Promise<PamCliSyncSnapshotType | null> {
    try {
      const raw = await readFile(
        this.getSnapshotPath(projectId, envName),
        'utf8'
      );
      const parsed = JSON.parse(raw) as PamCliSyncSnapshotType;
      if (parsed.version !== 1 || !parsed.variables) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * @param snapshot - Snapshot to persist
   */
  public async writeSnapshot(snapshot: PamCliSyncSnapshotType): Promise<void> {
    const path = this.getSnapshotPath(snapshot.projectId, snapshot.envName);
    await PamCliPrivateFsUtil.writePrivateFile(
      path,
      `${JSON.stringify(snapshot, null, 2)}\n`
    );
  }

  /**
   * Convenience writer after pull/push.
   *
   * @param projectId - Project uuid
   * @param projectSlug - Project slug
   * @param envName - Environment name
   * @param variables - Semantic key→value map
   */
  public async saveBaseline(
    projectId: string,
    projectSlug: string,
    envName: string,
    variables: Readonly<Record<string, string>>
  ): Promise<void> {
    await this.writeSnapshot({
      version: 1,
      projectId,
      projectSlug,
      envName,
      updatedAt: new Date().toISOString(),
      variables: { ...variables }
    });
  }

  /**
   * Removes all sync baselines under the active sync root (used by logout).
   */
  public async clearAll(): Promise<void> {
    await rm(this.getSyncRoot(), { recursive: true, force: true });
  }

  /**
   * Removes one env snapshot after `pamenv remove` (best-effort).
   *
   * @param projectId - Project uuid
   * @param envName - Environment name
   */
  public async clearSnapshot(
    projectId: string,
    envName: string
  ): Promise<void> {
    await rm(this.getSnapshotPath(projectId, envName), { force: true });
  }
}
