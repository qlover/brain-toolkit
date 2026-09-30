'use client';

import { LocaleLink } from '../LocaleLink';

export interface BrainHeaderNavItem {
  href: string;
  label: string;
  active?: boolean;
}

/** Plain text links next to the Brain header logo; hidden on small screens. */
export function BrainHeaderNav({ items }: { items: BrainHeaderNavItem[] }) {
  return (
    <nav
      data-testid="AppHeaderNav"
      className="max-sm:hidden flex items-center"
      aria-label="Main"
    >
      {items.map((item) => (
        <LocaleLink
          key={item.href}
          href={item.href}
          title={item.label}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.label}
        </LocaleLink>
      ))}
    </nav>
  );
}
