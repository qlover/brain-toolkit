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

interface PAMToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  viewMode: PAMViewModeType;
  onViewModeChange: (mode: PAMViewModeType) => void;
  categories: string[];
}

export const PAMToolbar: React.FC<PAMToolbarProps> = ({
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
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-bg-container p-3 sm:p-4 rounded-2xl shadow-sm border border-primary-border mb-5 md:mb-6"
    >
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <div className="relative flex-1 min-w-[140px] max-w-full sm:max-w-xs">
          <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary-text text-sm" />
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl border border-primary-border bg-bg-container focus:outline-none focus:ring-2 focus:ring-primary text-primary-text placeholder-tertiary-text text-sm touch-target"
          />
        </div>

        <div className="relative min-w-[100px]">
          <select
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none w-full bg-bg-container border border-primary-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-primary-text cursor-pointer touch-target"
          >
            <option value="">所有分类</option>
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
          <DownOutlined className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-tertiary-text text-[10px] sm:text-xs pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-primary-bg p-1 rounded-xl flex-shrink-0">
        <button
          onClick={() => onViewModeChange(PAMViewMode.Card)}
          className={clsx(
            'px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all touch-target-sm',
            {
              'bg-bg-container shadow-sm text-primary': viewMode === 'card',
              'text-secondary-text hover:bg-bg-container/50':
                viewMode !== 'card'
            }
          )}
        >
          <AppstoreOutlined className="text-xs sm:text-sm" />
          <span className="hidden xs:inline">卡片</span>
        </button>
        <button
          onClick={() => onViewModeChange(PAMViewMode.Compact)}
          className={clsx(
            'px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all touch-target-sm',
            {
              'bg-bg-container shadow-sm text-primary': viewMode === 'compact',
              'text-secondary-text hover:bg-bg-container/50':
                viewMode !== 'compact'
            }
          )}
        >
          <UnorderedListOutlined className="text-xs sm:text-sm" />
          <span className="hidden xs:inline">列表</span>
        </button>
      </div>
    </div>
  );
};
