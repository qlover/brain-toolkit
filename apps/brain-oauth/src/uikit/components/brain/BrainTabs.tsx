import type { ReactNode } from 'react';

export interface BrainTabItem<K extends string> {
  key: K;
  label: ReactNode;
}

export interface BrainTabsProps<K extends string> {
  items: BrainTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  'aria-label'?: string;
}

/** Text tabs with a gradient underline on the selected item. */
export function BrainTabs<K extends string>({
  items,
  value,
  onChange,
  'aria-label': ariaLabel
}: BrainTabsProps<K>) {
  return (
    <div
      data-testid="BrainTabs"
      className="brain-tabs"
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          data-testid={`BrainTab-${item.key}`}
          className="brain-tab"
          aria-selected={item.key === value}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
