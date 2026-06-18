import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit';
import { isEmpty } from 'lodash';
import { inject, injectable } from '@shared/container';
import { SearchParamsValidator } from '@shared/validators/SearchParamsValidator';
import { API_REQUEST_BODY_EMPTY } from '@config/i18n-identifier/api';
import { uuidSchema } from '@schemas/common';
import {
  PAMProjectSchemaType,
  PAMProjectWithEnvironmentsSchemaType,
  PAMProjectUpdateSchema,
  PAMProjectUpdateSchemaType
} from '@schemas/PAMProjectSchema';
import type { PAMServiceInterface } from '@server/interfaces/PAMServiceInterface';
import { PAMService } from '@server/services/PAMService';
import type { NextRequest } from 'next/server';

@injectable()
export class PAMController {
  @inject(PAMService)
  protected pamService!: PAMServiceInterface;

  @inject(SearchParamsValidator)
  protected searchParamsValidator!: SearchParamsValidator;

  public async searchPamList(
    request: NextRequest
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>> {
    const searchParams = request.nextUrl.searchParams;
    const search = this.searchParamsValidator.getThrow(searchParams);

    const result = await this.pamService.searchProjects(search);

    return result;
  }

  public getPamDetail(
    pamId: string,
    request: NextRequest
  ): Promise<PAMProjectWithEnvironmentsSchemaType | null> {
    const id = uuidSchema.parse(pamId);

    const withEnvironments = request.nextUrl.searchParams.get('isEnv') === '1';

    return this.pamService.getProjectDetail({
      id,
      withEnvironments
    });
  }

  public async updateProject(
    id: string,
    request: NextRequest
  ): Promise<PAMProjectUpdateSchemaType> {
    const body = await request.json();

    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const parsed = PAMProjectUpdateSchema.parse(body);

    if (isEmpty(parsed)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    return this.pamService.updateProject(id, parsed);
  }
}
