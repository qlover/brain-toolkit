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
      'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors sm:px-3 sm:py-1 sm:text-sm',
      active
        ? 'border-brand bg-brand/10 text-brand'
        : 'border-primary-border bg-elevated text-secondary-text hover:text-primary-text'
    );

  return (
    <>
      <div
        data-testid="PAMToolbar"
        className="bg-secondary mb-3 flex flex-col gap-2 rounded-xl border border-primary-border p-2 shadow-sm sm:mb-5 sm:gap-3 sm:rounded-2xl sm:p-4 md:mb-6"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="text-tertiary-text absolute top-1/2 left-2.5 -translate-y-1/2 sm:left-3">
              {searching ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
            </span>
            <input
              type="text"
              placeholder={tt.placeholderSearch}
              value={draftKeyword}
              onChange={onSearchChange}
              onKeyDown={onSearchKeyDown}
              className="bg-secondary h-9 w-full rounded-lg border border-primary-border py-1.5 pr-8 pl-8 text-sm text-primary-text placeholder-tertiary-text focus:ring-2 focus:ring-brand focus:outline-none sm:h-auto sm:rounded-xl sm:py-2.5 sm:pr-9 sm:pl-9"
            />
            {draftKeyword ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={onClearSearch}
                className="text-tertiary-text hover:text-secondary-text absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-1 transition-colors sm:right-2"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="bg-primary flex shrink-0 items-center gap-0.5 rounded-lg p-0.5 sm:gap-1 sm:rounded-xl sm:p-1">
            <button
              type="button"
              title={tt.pamViewModeCard}
              onClick={() => onViewModeChange(PAMViewMode.Card)}
              className={clsx(
                'inline-flex h-8 w-8 items-center justify-center rounded-md transition-all sm:h-auto sm:w-auto sm:gap-2 sm:rounded-lg sm:px-4 sm:py-1.5 sm:text-sm',
                {
                  'bg-elevated text-brand shadow-sm': viewMode === 'card',
                  'text-secondary-text hover:bg-elevated/50':
                    viewMode !== 'card'
                }
              )}
            >
              <Squares2X2Icon className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">
                {tt.pamViewModeCard}
              </span>
            </button>
            <button
              type="button"
              title={tt.pamViewModeList}
              onClick={() => onViewModeChange(PAMViewMode.Compact)}
              className={clsx(
                'inline-flex h-8 w-8 items-center justify-center rounded-md transition-all sm:h-auto sm:w-auto sm:gap-2 sm:rounded-lg sm:px-4 sm:py-1.5 sm:text-sm',
                {
                  'bg-elevated text-brand shadow-sm': viewMode === 'compact',
                  'text-secondary-text hover:bg-elevated/50':
                    viewMode !== 'compact'
                }
              )}
            >
              <ListBulletIcon className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">
                {tt.pamViewModeList}
              </span>
            </button>
          </div>

          {canCreate ? (
            <button
              type="button"
              id="addProjectBtn"
              title={tt.addPam}
              onClick={onCreate}
              className="bg-brand hover:bg-brand-hover active:bg-brand-active text-on-brand hidden shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-md transition sm:inline-flex"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{tt.addPam}</span>
            </button>
          ) : null}
        </div>

        <div
          data-testid="PAMToolbarCategoryChips"
          className="-mx-2 flex items-center gap-1.5 overflow-x-auto px-2 pb-0.5 scrollbar-none sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0"
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
