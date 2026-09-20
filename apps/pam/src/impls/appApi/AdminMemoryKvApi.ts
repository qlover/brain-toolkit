import { inject, injectable } from '@shared/container';
import { API_ADMIN_MEMORY_KV } from '@config/route';
import type {
  PamMemoryKvListResult,
  PamMemoryKvPurgeBody,
  PamMemoryKvPurgeResult
} from '@schemas/PamMemoryKvSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

@injectable()
export class AdminMemoryKvApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async list(params?: {
    prefix?: string;
  }): Promise<PamMemoryKvListResult> {
    const response = await this.appApiRequester.get(API_ADMIN_MEMORY_KV, {
      params: {
        prefix: params?.prefix ?? ''
      }
    });
    const envelope = response.data as NextKitApiSuccess<PamMemoryKvListResult>;
    return envelope.data ?? { entries: [], total: 0 };
  }

  public async purge(
    body: PamMemoryKvPurgeBody
  ): Promise<PamMemoryKvPurgeResult> {
    const response = await this.appApiRequester.post(API_ADMIN_MEMORY_KV, body);
    const envelope = response.data as NextKitApiSuccess<PamMemoryKvPurgeResult>;
    return envelope.data ?? { removed: 0 };
  }
}
