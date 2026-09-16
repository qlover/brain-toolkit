import {
  ResourceSearch,
  type ResourceSearchParams
} from '@qlover/corekit-bridge';
import {
  PageI18nProvider,
  useStore,
  useStrictEffect
} from '@qlover/next-kit/client';
import { useLocale } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { RequestLogsApi } from '@/impls/appApi/RequestLogsApi';
import { AdminPageShell } from '@/uikit/components-pages/AdminPageShell';
import { RequestLogsTable } from '@/uikit/components-pages/RequestLogsTable';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import { defaultSearchParams } from '@config/common';
import { i18nConfig } from '@config/i18n';
import { adminRequestLogs18n } from '@config/i18n-mapping/admin18n';
import type { PagesRouteParamsType } from '@server/render/PagesRouteParams';
import { PagesRouteParams } from '@server/render/PagesRouteParams';
import type { GetStaticPropsContext } from 'next';

interface AdminRequestLogsProps {
  messages: Record<string, string>;
}

const namespace = 'admin_request_logs';

const requestLogsSearchDefaultCriteria: ResourceSearchParams = {
  page: defaultSearchParams.page,
  pageSize: defaultSearchParams.pageSize,
  sort: [...defaultSearchParams.sort]
};

/**
 * Admin request logs (Pages Router / CSR).
 * Shell chrome comes from `_app` {@link AdminPagesAppShell}.
 */
export default function AdminRequestLogsPage({}: AdminRequestLogsProps) {
  const locale = useLocale();
  const pageI18n = useMemo(() => adminRequestLogs18n, []);
  const requestLogsApi = useIOC(RequestLogsApi);
  const seoMetadata = useI18nMapping(pageI18n);

  const searchResource = useMemo(
    () =>
      new ResourceSearch(requestLogsApi, {
        serviceName: 'requestLogsSearch',
        store: {
          criteria: requestLogsSearchDefaultCriteria
        }
      }),
    [requestLogsApi]
  );

  const store = searchResource.getStoreInterface();
  const rows = useStore(store, (state) => state.result?.items ?? []);
  const loading = useStore(store, (state) => state.loading);
  const result = useStore(store, (state) => state.result);
  const criteria = useStore(store, (state) => state.criteria);

  const currentPage = criteria?.page ?? defaultSearchParams.page;
  const pageSize = criteria?.pageSize ?? defaultSearchParams.pageSize;
  const total = result?.total ?? 0;

  const handlePaginationChange = useCallback(
    (page: number, nextPageSize: number) => {
      searchResource.refresh({ page, pageSize: nextPageSize });
    },
    [searchResource]
  );

  const tablePagination = useMemo(
    () => ({
      current: currentPage,
      pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: ['10', '15', '20', '50', '100'],
      onChange: handlePaginationChange
    }),
    [currentPage, pageSize, total, handlePaginationChange]
  );

  useStrictEffect(() => {
    searchResource.refresh();
  }, [searchResource]);

  return (
    <PageI18nProvider value={seoMetadata}>
      <AdminPageShell
        title={seoMetadata.title}
        description={seoMetadata.description}
        seoMetadata={seoMetadata}
      >
        <RequestLogsTable
          rows={rows}
          locale={locale}
          loading={loading}
          pagination={tablePagination}
        />
      </AdminPageShell>
    </PageI18nProvider>
  );
}

export async function getStaticProps({
  params
}: GetStaticPropsContext<PagesRouteParamsType>) {
  const pageParams = new PagesRouteParams(params);
  const messages = await pageParams.getI18nMessages(namespace);

  return {
    props: {
      messages
    }
  };
}

export async function getStaticPaths() {
  return {
    paths: i18nConfig.supportedLngs.map((locale) => ({
      params: { locale }
    })),
    fallback: false
  };
}
