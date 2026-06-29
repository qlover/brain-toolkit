import {
  SearchOutlined,
  DownOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { clsx } from 'clsx';
import {
  PAMViewMode,
  type PAMViewModeType
} from '@/interface/PAMFacadeInterface';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';

interface PAMToolbarProps {
  tt: PAMI18nInterface;
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  viewMode: PAMViewModeType;
  onViewModeChange: (mode: PAMViewModeType) => void;
  categories: string[];
}

export const PAMToolbar: React.FC<PAMToolbarProps> = ({
  tt,
  searchValue,
  onSearchChange,
  categoryValue,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  categories
}) => {
  return (
    <div
      data-testid="PAMToolbar"
      className="bg-secondary mb-5 flex flex-col gap-3 rounded-2xl border border-primary-border p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4 md:mb-6"
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative min-w-35 max-w-full flex-1 sm:max-w-xs">
          <SearchOutlined className="text-tertiary-text absolute top-1/2 left-3 -translate-y-1/2 text-sm" />
          <input
            type="text"
            placeholder={tt.placeholderSearch}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-secondary touch-target w-full rounded-xl border border-primary-border py-2 pr-4 pl-9 text-sm text-primary-text placeholder-tertiary-text focus:ring-2 focus:ring-brand focus:outline-none sm:py-2.5"
          />
        </div>

        <div className="relative min-w-25">
          <select
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-secondary touch-target w-full cursor-pointer appearance-none rounded-xl border border-primary-border px-3 py-2 pr-7 text-sm text-primary-text focus:ring-2 focus:ring-brand focus:outline-none sm:px-4 sm:py-2.5 sm:pr-8"
          >
            <option value="">{tt.allCategory}</option>
            {categories.map((cat) => (
              <option
                data-testid="PAMToolbarCategoryItem"
                key={cat}
                value={cat}
              >
                {cat}
              </option>
            ))}
          </select>
          <DownOutlined className="text-tertiary-text pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] sm:right-3 sm:text-xs" />
        </div>
      </div>

      <div className="bg-primary flex shrink-0 items-center gap-1 rounded-xl p-1">
        <button
          title={tt.pamViewModeCard}
          onClick={() => onViewModeChange(PAMViewMode.Card)}
          className={clsx(
            'touch-target-sm flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-1.5 sm:text-sm',
            {
              'bg-elevated text-brand shadow-sm': viewMode === 'card',
              'text-secondary-text hover:bg-elevated/50': viewMode !== 'card'
            }
          )}
        >
          <AppstoreOutlined className="text-xs sm:text-sm" />
          <span className="xs:inline hidden">{tt.pamViewModeCard}</span>
        </button>
        <button
          title={tt.pamViewModeList}
          onClick={() => onViewModeChange(PAMViewMode.Compact)}
          className={clsx(
            'touch-target-sm flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-1.5 sm:text-sm',
            {
              'bg-elevated text-brand shadow-sm': viewMode === 'compact',
              'text-secondary-text hover:bg-elevated/50': viewMode !== 'compact'
            }
          )}
        >
          <UnorderedListOutlined className="text-xs sm:text-sm" />
          <span className="xs:inline hidden">{tt.pamViewModeList}</span>
        </button>
      </div>
    </div>
  );
};
