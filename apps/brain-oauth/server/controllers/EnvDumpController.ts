import { inject, injectable } from '@shared/container';
import { ENV_DUMP_TOKEN_HEADER } from '@config/EnvDumpConfig';
import {
  EnvDumpService,
  type EnvDumpResultType
} from '@server/services/EnvDumpService';
import { OAuthUserService } from '@server/services/OAuthUserService';
import type { UserServiceInterface } from '../interfaces/UserServiceInterface';
import type { NextRequest } from 'next/server';

/**
 * 临时 env dump API 编排（admin + 开关 + token）。
 */
@injectable()
export class EnvDumpController {
  constructor(
    @inject(OAuthUserService) protected userService: UserServiceInterface,
    @inject(EnvDumpService) protected envDumpService: EnvDumpService
  ) {}

  /**
   * @param request - 用于读取 dump token 头
   */
  public async dump(request: NextRequest): Promise<EnvDumpResultType> {
    const user = await this.userService.getUser();
    const token = request.headers.get(ENV_DUMP_TOKEN_HEADER);
    return this.envDumpService.dump(token, String(user.id));
  }
}
