import { inject, injectable } from '@shared/container';
import type { BrainLoginEnvs } from '@config/brainApi';
import { API_BRAIN_ENVS } from '@config/route';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

@injectable()
export class BrainEnvApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async getLoginEnvs(): Promise<BrainLoginEnvs> {
    const response = await this.appApiRequester.get(API_BRAIN_ENVS);
    const envelope = response.data as NextKitApiSuccess<BrainLoginEnvs>;
    return envelope.data ?? { envs: [], defaultEnv: '' };
  }
}
