import { inject, injectable } from '@shared/container';
import {
  API_ADMIN_LOCALES,
  API_ADMIN_LOCALES_IMPORT,
  API_ADMIN_LOCALES_NAMESPACES
} from '@config/apiRoutes';
import type { LocaleType } from '@config/i18n';
import type {
  PamAdminLocaleCreate,
  PamAdminLocaleItem,
  PamAdminLocaleUpdate,
  PamAdminLocalesImportResult
} from '@schemas/PamLocalesSchema';
import { AppApiRequester } from './AppApiRequester';
import type { ResourceSearchResult } from '@qlover/corekit-bridge';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

@injectable()
export class AdminLocalesApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async search(params?: {
    locale?: LocaleType;
    keyword?: string;
    namespace?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ResourceSearchResult<PamAdminLocaleItem>> {
    const response = await this.appApiRequester.get(API_ADMIN_LOCALES, {
      params: {
        locale: params?.locale ?? '',
        keyword: params?.keyword ?? '',
        namespace: params?.namespace ?? '',
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20
      }
    });
    const envelope = response.data as NextKitApiSuccess<
      ResourceSearchResult<PamAdminLocaleItem>
    >;
    return (
      envelope.data ?? {
        items: [],
        total: 0,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        hasMore: false
      }
    );
  }

  public async listNamespaces(): Promise<string[]> {
    const response = await this.appApiRequester.get(
      API_ADMIN_LOCALES_NAMESPACES
    );
    const envelope = response.data as NextKitApiSuccess<string[]>;
    return envelope.data ?? [];
  }

  public async create(
    body: PamAdminLocaleCreate
  ): Promise<PamAdminLocaleItem | null> {
    const response = await this.appApiRequester.post(API_ADMIN_LOCALES, body);
    const envelope =
      response.data as NextKitApiSuccess<PamAdminLocaleItem | null>;
    return envelope.data ?? null;
  }

  public async update(body: PamAdminLocaleUpdate): Promise<void> {
    await this.appApiRequester.patch(API_ADMIN_LOCALES, body);
  }

  public async importFromStatic(): Promise<PamAdminLocalesImportResult> {
    const response = await this.appApiRequester.post(API_ADMIN_LOCALES_IMPORT);
    const envelope =
      response.data as NextKitApiSuccess<PamAdminLocalesImportResult>;
    return (
      envelope.data ?? {
        totalCount: 0,
        successCount: 0,
        failureCount: 0
      }
    );
  }
}
