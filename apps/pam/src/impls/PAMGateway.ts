import { RequestExecutor } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import {
  AppApiConfig,
  AppApiRequester,
  AppApiRequesterContext
} from './appApi/AppApiRequester';

@injectable()
export class PAMGateway {
  constructor(
    @inject(AppApiRequester)
    protected client: RequestExecutor<AppApiConfig, AppApiRequesterContext>
  ) {}
}
