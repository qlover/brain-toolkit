import {
  AdjustmentsHorizontalIcon,
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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from 'react';
import { createPortal } from 'react-dom';
import { PAMViewMode } from '@/interface/PAMFacadeInterface';
import type {
  PAMViewModeType,
  PAMFacadeInterface,
  PAMFacadeStateInterface
} from '@/interface/PAMFacadeInterface';
import { ResponsiveModal } from '@/uikit/components/ResponsiveModal';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { mergePamCategories } from '@config/pamCategories';
import {
  PAMListSortBy,
  PAMListSortOrder,
  isDefaultPamListSortState,
  type PAMListSortByType,
  type PAMListSortOrderType
} from '@config/pamListSort';
import type { PAMProjectDetail } from '@schemas/PAMProjectSchema';

const SEARCH_DEBOUNCE_MS = 350;
const FILTERS_PANEL_WIDTH = 288;
const FILTERS_PANEL_GAP = 8;
const MOBILE_FILTERS_MQ = '(max-width: 639px)';

function isMobileFiltersViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia(MOBILE_FILTERS_MQ).matches
  );
}

function computeFiltersPanelPosition(buttonRect: DOMRect): {
  top: number;
  left: number;
} {
  const viewportMargin = 8;
  let left = buttonRect.left;
  const maxLeft = window.innerWidth - FILTERS_PANEL_WIDTH - viewportMargin;
  if (left > maxLeft) {
    left = maxLeft;
  }
  if (left < viewportMargin) {
    left = viewportMargin;
  }
  return {
    top: buttonRect.bottom + FILTERS_PANEL_GAP,
    left
  };
}

function FilterOption({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      data-testid="FilterOption"
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-brand text-on-brand shadow-sm'
          : 'text-secondary-text hover:bg-elevated hover:text-primary-text'
      )}
    >
      {children}
    </button>
  );
}

function PAMToolbarFiltersContent({
  tt,
  visibilityValue,
  onVisibilityChange,
  showPrivateVisibility,
  sortValue,
  sortOrder,
  onSortChange
}: {
  tt: PAMI18nInterface;
  visibilityValue: string;
  onVisibilityChange: (value: string) => void;
  showPrivateVisibility: boolean;
  sortValue: PAMListSortByType;
  sortOrder: PAMListSortOrderType;
  onSortChange: (
    sortBy: PAMListSortByType,
    sortOrder: PAMListSortOrderType
  ) => void;
}) {
  return (
    <div data-testid="PAMToolbarFiltersContent" className="space-y-3">
      <div>
        <p className="text-tertiary-text mb-2 text-[11px] font-semibold tracking-wide uppercase">
          {tt.labelVisibility}
        </p>
        <div
          data-testid="PAMToolbarVisibilityChips"
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={tt.labelVisibility}
        >
          <FilterOption
            active={visibilityValue === ''}
            onClick={() => onVisibilityChange('')}
          >
            {tt.allVisibility}
          </FilterOption>
          <FilterOption
            active={visibilityValue === 'public'}
            onClick={() => onVisibilityChange('public')}
          >
            {tt.public}
          </FilterOption>
          {showPrivateVisibility ? (
            <FilterOption
              active={visibilityValue === 'private'}
              onClick={() => onVisibilityChange('private')}
            >
              {tt.private}
            </FilterOption>
          ) : null}
        </div>
      </div>

      <div className="border-t border-primary-border pt-3">
        <p className="text-tertiary-text mb-2 text-[11px] font-semibold tracking-wide uppercase">
          {tt.labelSort}
        </p>
        <div
          data-testid="PAMToolbarSortChips"
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={tt.labelSort}
        >
          <FilterOption
            active={sortValue === PAMListSortBy.CreatedAt}
            onClick={() => onSortChange(PAMListSortBy.CreatedAt, sortOrder)}
          >
            {tt.sortByCreated}
          </FilterOption>
          <FilterOption
            active={sortValue === PAMListSortBy.UpdatedAt}
            onClick={() => onSortChange(PAMListSortBy.UpdatedAt, sortOrder)}
          >
            {tt.sortByUpdated}
          </FilterOption>
        </div>
      </div>

      <div className="border-t border-primary-border pt-3">
        <p className="text-tertiary-text mb-2 text-[11px] font-semibold tracking-wide uppercase">
          {tt.labelSortOrder}
        </p>
        <div
          data-testid="PAMToolbarSortOrderChips"
          className="flex flex-wrap gap-1"
          role="group"
          aria-label={tt.labelSortOrder}
        >
          <FilterOption
            active={sortOrder === PAMListSortOrder.Desc}
            onClick={() => onSortChange(sortValue, PAMListSortOrder.Desc)}
          >
            {tt.sortOrderDesc}
          </FilterOption>
          <FilterOption
            active={sortOrder === PAMListSortOrder.Asc}
            onClick={() => onSortChange(sortValue, PAMListSortOrder.Asc)}
          >
            {tt.sortOrderAsc}
          </FilterOption>
        </div>
      </div>
    </div>
  );
}

function ViewModeToggle({
  viewMode,
  onViewModeChange,
  tt
}: {
  viewMode: PAMViewModeType;
  onViewModeChange: (mode: PAMViewModeType) => void;
  tt: PAMI18nInterface;
}) {
  const isCard = viewMode === PAMViewMode.Card;

  return (
    <div
      data-testid="PAMToolbarViewToggle"
      className="bg-primary/80 relative inline-grid h-10 shrink-0 grid-cols-2 rounded-full p-1 ring-1 ring-primary-border/60 sm:h-11"
      role="group"
      aria-label={`${tt.pamViewModeCard} / ${tt.pamViewModeList}`}
    >
      <span
        aria-hidden
        className={clsx(
          'pointer-events-none absolute inset-y-1 rounded-full bg-secondary ring-1 ring-primary-border/50 transition-all duration-200 ease-out',
          isCard
            ? 'left-1 right-[calc(50%+0.125rem)]'
            : 'left-[calc(50%+0.125rem)] right-1'
        )}
      />

      <button
        type="button"
        title={tt.pamViewModeCard}
        aria-label={tt.pamViewModeCard}
        aria-pressed={isCard}
        onClick={() => onViewModeChange(PAMViewMode.Card)}
        className={clsx(
          'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors sm:px-3.5 sm:text-sm',
          isCard ? 'text-brand' : 'text-secondary-text hover:text-primary-text'
        )}
      >
        <Squares2X2Icon className="h-4 w-4 shrink-0" />
        <span className="hidden min-[420px]:inline">{tt.pamViewModeCard}</span>
      </button>

      <button
        type="button"
        title={tt.pamViewModeList}
        aria-label={tt.pamViewModeList}
        aria-pressed={!isCard}
        onClick={() => onViewModeChange(PAMViewMode.Compact)}
        className={clsx(
          'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors sm:px-3.5 sm:text-sm',
          !isCard ? 'text-brand' : 'text-secondary-text hover:text-primary-text'
        )}
      >
        <ListBulletIcon className="h-4 w-4 shrink-0" />
        <span className="hidden min-[420px]:inline">{tt.pamViewModeList}</span>
      </button>
    </div>
  );
}

interface PAMToolbarProps {
  tt: PAMI18nInterface;
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  visibilityValue: string;
  onVisibilityChange: (value: string) => void;
  sortValue: PAMListSortByType;
  sortOrder: PAMListSortOrderType;
  onSortChange: (
    sortBy: PAMListSortByType,
    sortOrder: PAMListSortOrderType
  ) => void;
  showPrivateVisibility?: boolean;
  viewMode: PAMViewModeType;
  onViewModeChange: (mode: PAMViewModeType) => void;
  categories: string[];
  facadeInterface: PAMFacadeInterface<PAMProjectDetail>;
  onCreate: () => void;
  canCreate?: boolean;
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
  sortValue,
  sortOrder,
  onSortChange,
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobileFilters, setIsMobileFilters] = useState(
    isMobileFiltersViewport
  );
  const [panelPosition, setPanelPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);

  const chipCategories = useMemo(
    () => mergePamCategories(categories),
    [categories]
  );

  useEffect(() => {
    setDraftKeyword(storeKeyword);
  }, [storeKeyword]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_FILTERS_MQ);
    const syncViewport = () => {
      setIsMobileFilters(mediaQuery.matches);
    };
    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => {
      mediaQuery.removeEventListener('change', syncViewport);
    };
  }, []);

  const updatePanelPosition = useCallback(() => {
    const button = filtersButtonRef.current;
    if (!button) {
      return;
    }
    setPanelPosition(
      computeFiltersPanelPosition(button.getBoundingClientRect())
    );
  }, []);

  useLayoutEffect(() => {
    if (!filtersOpen || isMobileFilters) {
      setPanelPosition(null);
      return;
    }
    updatePanelPosition();
  }, [filtersOpen, isMobileFilters, updatePanelPosition]);

  useEffect(() => {
    if (!filtersOpen || isMobileFilters) {
      return;
    }
    const onReposition = () => {
      updatePanelPosition();
    };
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [filtersOpen, isMobileFilters, updatePanelPosition]);

  useEffect(() => {
    if (!filtersOpen || isMobileFilters) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filtersButtonRef.current?.contains(target) ||
        filtersPanelRef.current?.contains(target)
      ) {
        return;
      }
      setFiltersOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [filtersOpen, isMobileFilters]);

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

  const hasCategoryChips = chipCategories.length > 0;
  const showCategoryFilters = hasCategoryChips || categoryValue.length > 0;

  const filterBadgeCount =
    (visibilityValue ? 1 : 0) +
    (isDefaultPamListSortState(sortValue, sortOrder) ? 0 : 1);

  const categoryChipClass = (active: boolean) =>
    clsx(
      'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
      active
        ? 'bg-brand text-on-brand'
        : 'bg-elevated text-secondary-text ring-1 ring-primary-border/80 hover:text-primary-text'
    );

  const filtersContentProps = {
    tt,
    visibilityValue,
    onVisibilityChange,
    showPrivateVisibility,
    sortValue,
    sortOrder,
    onSortChange
  };

  const desktopFiltersPanel =
    filtersOpen && !isMobileFilters && panelPosition
      ? createPortal(
          <div
            ref={filtersPanelRef}
            data-testid="PAMToolbarFiltersPanel"
            role="dialog"
            aria-label={tt.filters}
            style={{
              top: panelPosition.top,
              left: panelPosition.left,
              width: FILTERS_PANEL_WIDTH
            }}
            className="bg-secondary fixed z-50 rounded-xl border border-primary-border p-3 shadow-lg"
          >
            <PAMToolbarFiltersContent {...filtersContentProps} />
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div data-testid="PAMToolbar" className="mb-4 flex flex-col sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-md lg:max-w-lg">
            <span className="text-tertiary-text pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
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
              className="bg-elevated/70 h-10 w-full rounded-xl py-2 pr-9 pl-10 text-sm text-primary-text ring-1 ring-primary-border/70 transition placeholder:text-tertiary-text focus:ring-2 focus:ring-brand focus:outline-none sm:h-11"
            />
            {draftKeyword ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={onClearSearch}
                className="text-tertiary-text hover:text-secondary-text absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="relative shrink-0">
            <button
              ref={filtersButtonRef}
              type="button"
              data-testid="PAMToolbarFiltersButton"
              aria-expanded={filtersOpen}
              aria-haspopup="dialog"
              onClick={() => setFiltersOpen((open) => !open)}
              className={clsx(
                'inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium ring-1 transition sm:h-11 sm:px-3.5',
                filtersOpen || filterBadgeCount > 0
                  ? 'bg-brand/10 text-brand ring-brand/30'
                  : 'bg-elevated/70 text-secondary-text ring-primary-border/70 hover:text-primary-text'
              )}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tt.filters}</span>
              {filterBadgeCount > 0 ? (
                <span className="bg-brand text-on-brand inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {filterBadgeCount}
                </span>
              ) : null}
            </button>
          </div>

          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            tt={tt}
          />

          {canCreate ? (
            <button
              type="button"
              id="addProjectBtn"
              title={tt.addPam}
              onClick={onCreate}
              className="bg-brand hover:bg-brand-hover active:bg-brand-active text-on-brand hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium shadow-sm transition sm:inline-flex sm:h-11"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{tt.addPam}</span>
            </button>
          ) : null}
        </div>

        {showCategoryFilters ? (
          <div
            data-testid="PAMToolbarCategoryChips"
            className="mt-3 overflow-x-auto overscroll-x-contain py-1.5 scrollbar-none sm:mt-3.5"
            role="group"
            aria-label={tt.labelCategory}
          >
            <div className="flex w-max min-w-full items-center gap-1.5">
              <button
                type="button"
                data-testid="PAMToolbarCategoryAll"
                onClick={() => onCategoryChange('')}
                className={categoryChipClass(categoryValue === '')}
              >
                {tt.allCategory}
              </button>
              {chipCategories.map((cat) => (
                <button
                  type="button"
                  data-testid="PAMToolbarCategoryItem"
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={categoryChipClass(categoryValue === cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        ) : null}
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

      {desktopFiltersPanel}

      <ResponsiveModal
        open={filtersOpen && isMobileFilters}
        title={tt.filters}
        onClose={() => setFiltersOpen(false)}
        showFullscreenToggle={false}
        closeLabel={tt.formCancel}
        bodyClassName="px-4 py-4"
      >
        <PAMToolbarFiltersContent {...filtersContentProps} />
      </ResponsiveModal>
    </>
  );
};
