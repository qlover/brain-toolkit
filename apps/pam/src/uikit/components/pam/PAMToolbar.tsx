import React from 'react';

interface PAMToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  viewMode: 'card' | 'compact';
  onViewModeChange: (mode: 'card' | 'compact') => void;
  categories: string[]; // 可选分类列表
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
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-container p-4 rounded-2xl shadow-sm border border-primary-border mb-6"
    >
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="relative flex-grow max-w-xs">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-tertiary-text text-sm"></i>
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-primary-border bg-bg-container focus:outline-none focus:ring-2 focus:ring-primary text-primary-text placeholder-tertiary-text text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none bg-bg-container border border-primary-border rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-primary-text"
          >
            <option value="">所有分类</option>
            {categories.map((cat) => (
              <option data-testid="PAMToolbar" key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-tertiary-text text-xs pointer-events-none"></i>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-primary-bg p-1 rounded-xl">
        <button
          onClick={() => onViewModeChange('card')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            viewMode === 'card'
              ? 'bg-elevated shadow-sm text-primary'
              : 'text-secondary-text hover:bg-elevated/50'
          }`}
        >
          <i className="fas fa-th-large"></i> 卡片
        </button>
        <button
          onClick={() => onViewModeChange('compact')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            viewMode === 'compact'
              ? 'bg-elevated shadow-sm text-primary'
              : 'text-secondary-text hover:bg-elevated/50'
          }`}
        >
          <i className="fas fa-list-ul"></i> 列表
        </button>
      </div>
    </div>
  );
};
