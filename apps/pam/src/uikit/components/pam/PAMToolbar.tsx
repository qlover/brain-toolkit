import {
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useStore } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { debounce } from 'lodash-es';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from 'react';
import { PAMViewMode } from '@/interface/PAMFacadeInterface';
import type {
  PAMViewModeType,
  PAMFacadeInterface,
  PAMFacadeStateInterface
} from '@/interface/PAMFacadeInterface';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { mergePamCategories } from '@config/pamCategories';
import type { PAMProjectDetail } from '@schemas/PAMProjectSchema';

const SEARCH_DEBOUNCE_MS = 350;

interface PAMToolbarProps {
  tt: PAMI18nInterface;
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  visibilityValue: string;
  onVisibilityChange: (value: string) => void;
  /** When false, hide the private visibility chip (guests). */
  showPrivateVisibility?: boolean;
  viewMode: PAMViewModeType;
  onViewModeChange: (mode: PAMViewModeType) => void;
  categories: string[];
  facadeInterface: PAMFacadeInterface<PAMProjectDetail>;
  onCreate: () => void;
  /** Hide create CTA when false (e.g. guest). */
  canCreate?: boolean;
  /** True while a list request is in flight. */
  searching?: boolean;
}

function keywordSelector(state: PAMFacadeStateInterface<PAMProjectDetail>) {
  return state.searchParams.keyword || '';
}

export const PAMToolbar: React.FC<PAMToolbarProps> = ({
  tt,
  categoryValue,
  onCategoryChange,
  visibilityValue,
  onVisibilityChange,
  showPrivateVisibility = false,
  viewMode,
  onViewModeChange,
  categories,
  facadeInterface,
  onCreate,
  canCreate = false,
  searching = false
}) => {
  const facadeStore = facadeInterface.getFacadeStore();
  const storeKeyword = useStore(facadeStore, keywordSelector);
  const [draftKeyword, setDraftKeyword] = useState(storeKeyword);

  const chipCategories = useMemo(
    () => mergePamCategories(categories),
    [categories]
  );

  useEffect(() => {
    setDraftKeyword(storeKeyword);
  }, [storeKeyword]);

  const runSearch = useCallback(
    (keyword: string) => {
      facadeStore.update({
        searchParams: {
          ...facadeStore.getState().searchParams,
          keyword
        }
      });
      void facadeInterface.searchProjectWithKeyword(keyword);
    },
    [facadeStore, facadeInterface]
  );

  const debouncedSearch = useMemo(
    () => debounce(runSearch, SEARCH_DEBOUNCE_MS),
    [runSearch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const keyword = e.target.value;
      setDraftKeyword(keyword);
      debouncedSearch(keyword);
    },
    [debouncedSearch]
  );

  const flushSearch = useCallback(() => {
    debouncedSearch.flush();
  }, [debouncedSearch]);

  const onSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        flushSearch();
      }
    },
    [flushSearch]
  );

  const onClearSearch = useCallback(() => {
    debouncedSearch.cancel();
    setDraftKeyword('');
    runSearch('');
  }, [debouncedSearch, runSearch]);

  const chipClass = (active: boolean) =>
    clsx(
      'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors sm:text-xs',
      active
        ? 'border-brand bg-brand/10 text-brand'
        : 'border-primary-border bg-elevated text-secondary-text hover:text-primary-text'
    );

  const hasCategoryChips = chipCategories.length > 0;
  const showCategoryFilters = hasCategoryChips || categoryValue.length > 0;

  const filterChips = (
    <>
      <div
        data-testid="PAMToolbarVisibilityChips"
        className="flex shrink-0 items-center gap-1"
        role="group"
        aria-label={tt.labelVisibility}
      >
        <button
          type="button"
          data-testid="PAMToolbarVisibilityAll"
          onClick={() => onVisibilityChange('')}
          className={chipClass(visibilityValue === '')}
        >
          {tt.allVisibility}
        </button>
        <button
          type="button"
          data-testid="PAMToolbarVisibilityPublic"
          onClick={() => onVisibilityChange('public')}
          className={chipClass(visibilityValue === 'public')}
        >
          {tt.public}
        </button>
        {showPrivateVisibility ? (
          <button
            type="button"
            data-testid="PAMToolbarVisibilityPrivate"
            onClick={() => onVisibilityChange('private')}
            className={chipClass(visibilityValue === 'private')}
          >
            {tt.private}
          </button>
        ) : null}
      </div>

      {showCategoryFilters ? (
        <>
          <span
            className="mx-0.5 h-3 w-px shrink-0 bg-primary-border"
            aria-hidden
          />
          <div
            data-testid="PAMToolbarCategoryChips"
            className="flex shrink-0 items-center gap-1"
            role="group"
            aria-label={tt.labelCategory}
          >
            <button
              type="button"
              data-testid="PAMToolbarCategoryAll"
              onClick={() => onCategoryChange('')}
              className={chipClass(categoryValue === '')}
            >
              {tt.allCategory}
            </button>
            {chipCategories.map((cat) => (
              <button
                type="button"
                data-testid="PAMToolbarCategoryItem"
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={chipClass(categoryValue === cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </>
  );

  const toolbarActions = (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="bg-primary flex items-center gap-0.5 rounded-md p-0.5">
        <button
          type="button"
          title={tt.pamViewModeCard}
          aria-label={tt.pamViewModeCard}
          onClick={() => onViewModeChange(PAMViewMode.Card)}
          className={clsx(
            'inline-flex h-7 w-7 items-center justify-center rounded transition-all',
            viewMode === 'card'
              ? 'bg-elevated text-brand shadow-sm'
              : 'text-secondary-text hover:bg-elevated/50'
          )}
        >
          <Squares2X2Icon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title={tt.pamViewModeList}
          aria-label={tt.pamViewModeList}
          onClick={() => onViewModeChange(PAMViewMode.Compact)}
          className={clsx(
            'inline-flex h-7 w-7 items-center justify-center rounded transition-all',
            viewMode === 'compact'
              ? 'bg-elevated text-brand shadow-sm'
              : 'text-secondary-text hover:bg-elevated/50'
          )}
        >
          <ListBulletIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {canCreate ? (
        <button
          type="button"
          id="addProjectBtn"
          title={tt.addPam}
          onClick={onCreate}
          className="bg-brand hover:bg-brand-hover active:bg-brand-active text-on-brand hidden h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium shadow-sm transition sm:inline-flex"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>{tt.addPam}</span>
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <div
        data-testid="PAMToolbar"
        className="bg-secondary mb-2 rounded-lg border border-primary-border p-2 shadow-sm sm:mb-3 sm:rounded-xl"
      >
        <div className="grid gap-1.5 md:grid-cols-[minmax(11rem,14rem)_1fr_auto] md:items-center md:gap-x-2">
          <div className="flex items-center gap-1.5 md:contents">
            <div className="relative min-w-0 flex-1 md:col-start-1 md:row-start-1">
              <span className="text-tertiary-text absolute top-1/2 left-2 -translate-y-1/2">
                {searching ? (
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                )}
              </span>
              <input
                type="text"
                placeholder={tt.placeholderSearch}
                value={draftKeyword}
                onChange={onSearchChange}
                onKeyDown={onSearchKeyDown}
                className="bg-secondary h-8 w-full rounded-md border border-primary-border py-1 pr-7 pl-7 text-sm text-primary-text placeholder-tertiary-text focus:ring-2 focus:ring-brand focus:outline-none"
              />
              {draftKeyword ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={onClearSearch}
                  className="text-tertiary-text hover:text-secondary-text absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 transition-colors"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="md:col-start-3 md:row-start-1">
              {toolbarActions}
            </div>
          </div>

          <div
            data-testid="PAMToolbarFilters"
            className="-mx-0.5 flex min-w-0 items-center gap-1 overflow-x-auto px-0.5 scrollbar-none md:col-start-2 md:row-start-1 md:flex-wrap md:overflow-visible md:px-0"
          >
            {filterChips}
          </div>
        </div>
      </div>

      {canCreate ? (
        <button
          type="button"
          id="fabCreateBtn"
          title={tt.addPam}
          aria-label={tt.addPam}
          onClick={onCreate}
          className="bg-brand hover:bg-brand-hover active:bg-brand-active text-on-brand fixed right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition sm:hidden"
          style={{
            bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))'
          }}
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      ) : null}
    </>
  );
};
