import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import { SearchParamsValidator } from '@shared/validators/SearchParamsValidator';
import { uuidSchema } from '@schemas/common';
import {
  PAMProjectSchemaType,
  PAMProjectWithEnvironmentsSchemaType
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
    pamId: string
  ): Promise<PAMProjectWithEnvironmentsSchemaType | null> {
    const id = uuidSchema.parse(pamId);
    return this.pamService.getProjectWithEnvironment(id);
  }
}
