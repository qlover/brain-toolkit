'use client';

import { clsx } from 'clsx';
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';

export type DropdownItem = {
  key: string;
  label?: ReactNode;
  disabled?: boolean;
  /** Destructive action styling (e.g. delete). */
  danger?: boolean;
  /** Visual separator; not selectable. */
  divider?: boolean;
};

export type DropdownPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end';

export interface DropdownProps {
  items: DropdownItem[];
  children: ReactElement;
  selectedKeys?: string[];
  onSelect?: (key: string) => void;
  placement?: DropdownPlacement;
  /**
   * Mobile presentation:
   * - `sheet` (default): bottom sheet + backdrop, better for touch
   * - `menu`: same floating menu as desktop
   */
  mobileMode?: 'sheet' | 'menu';
  className?: string;
  menuClassName?: string;
  'data-testid'?: string;
}

const MOBILE_MQ = '(max-width: 767px)';
const VIEWPORT_PAD = 8;
const TRIGGER_GAP = 8;
const MENU_MIN_WIDTH = 10 * 16;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}

/**
 * AntD-like placement: preferred side, flip when short of space, shift into viewport.
 */
function computeMenuPosition(
  trigger: DOMRect,
  menuWidth: number,
  menuHeight: number,
  placement: DropdownPlacement
): { top: number; left: number } {
  const preferBottom = placement.startsWith('bottom');
  const preferEnd = placement.endsWith('end');
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceBelow = vh - trigger.bottom - TRIGGER_GAP - VIEWPORT_PAD;
  const spaceAbove = trigger.top - TRIGGER_GAP - VIEWPORT_PAD;
  let placeBottom = preferBottom;
  if (preferBottom) {
    if (menuHeight > spaceBelow && spaceAbove > spaceBelow) {
      placeBottom = false;
    }
  } else if (menuHeight > spaceAbove && spaceBelow > spaceAbove) {
    placeBottom = true;
  }

  let top = placeBottom
    ? trigger.bottom + TRIGGER_GAP
    : trigger.top - menuHeight - TRIGGER_GAP;

  let left = preferEnd ? trigger.right - menuWidth : trigger.left;

  left = Math.min(Math.max(VIEWPORT_PAD, left), vw - menuWidth - VIEWPORT_PAD);
  top = Math.min(Math.max(VIEWPORT_PAD, top), vh - menuHeight - VIEWPORT_PAD);

  return { top, left };
}

/** Off-screen + invisible until first successful measure (avoids 0,0 flash). */
const MEASURE_STYLE: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1100,
  visibility: 'hidden',
  pointerEvents: 'none'
};

type MenuCoords = {
  top: number;
  left: number;
  minWidth: number;
};

/**
 * Responsive dropdown (antd-free).
 * Desktop: floating menu near the trigger with flip/shift auto-placement.
 * Mobile (`mobileMode="sheet"`): bottom sheet with dimmed backdrop.
 */
export function Dropdown({
  items,
  children,
  selectedKeys = [],
  onSelect,
  placement = 'bottom-end',
  mobileMode = 'sheet',
  className,
  menuClassName,
  'data-testid': dataTestId = 'Dropdown'
}: DropdownProps) {
  const listId = useId();
  const triggerWrapRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<MenuCoords | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const isMobile = useIsMobile();
  const useSheet = isMobile && mobileMode === 'sheet';

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  /**
   * Measure with final minWidth applied, then reveal once.
   * Skips React updates when top/left/minWidth are unchanged (avoids flash).
   */
  const updatePosition = useCallback(() => {
    if (useSheet) return false;
    const triggerEl = triggerWrapRef.current;
    const menuEl = menuRef.current;
    if (!triggerEl || !menuEl) return false;

    const trigger = triggerEl.getBoundingClientRect();
    const minWidth = Math.max(trigger.width, MENU_MIN_WIDTH);

    // Lock minWidth before measuring so bottom-end left is stable.
    menuEl.style.minWidth = `${minWidth}px`;
    const menuWidth = Math.max(menuEl.offsetWidth, minWidth);
    const menuHeight = menuEl.offsetHeight;
    if (menuWidth === 0 || menuHeight === 0) return false;

    const { top, left } = computeMenuPosition(
      trigger,
      menuWidth,
      menuHeight,
      placement
    );

    const next: MenuCoords = { top, left, minWidth };
    const prev = coordsRef.current;
    const unchanged =
      prev &&
      prev.top === next.top &&
      prev.left === next.left &&
      prev.minWidth === next.minWidth;

    // Imperative write before paint — keeps DOM correct even if React hasn't committed.
    menuEl.style.position = 'fixed';
    menuEl.style.top = `${top}px`;
    menuEl.style.left = `${left}px`;
    menuEl.style.zIndex = '1100';
    menuEl.style.minWidth = `${minWidth}px`;
    menuEl.style.visibility = 'visible';
    menuEl.style.pointerEvents = 'auto';

    if (unchanged) return true;

    coordsRef.current = next;
    setCoords(next);
    return true;
  }, [placement, useSheet]);

  useLayoutEffect(() => {
    if (!open) {
      coordsRef.current = null;
      setCoords(null);
      return;
    }
    if (useSheet) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let ignoreRo = true;
    let retryRaf = 0;

    if (!updatePosition()) {
      // Portal/layout may not have size yet; retry once before paint via rAF.
      retryRaf = requestAnimationFrame(() => {
        if (!cancelled) updatePosition();
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      const menuEl = menuRef.current;
      if (menuEl) {
        ro = new ResizeObserver(() => {
          // observe() often fires once immediately — ignore that to avoid a jump.
          if (ignoreRo) {
            ignoreRo = false;
            return;
          }
          if (!cancelled) updatePosition();
        });
        ro.observe(menuEl);
      }
    }

    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      cancelled = true;
      cancelAnimationFrame(retryRaf);
      ro?.disconnect();
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updatePosition, useSheet]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerWrapRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !useSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, useSheet]);

  const handleSelect = useCallback(
    (key: string, disabled?: boolean) => {
      if (disabled) return;
      onSelect?.(key);
      close();
    },
    [onSelect, close]
  );

  const child = Children.only(children);
  if (!isValidElement(child)) {
    return null;
  }

  const trigger = cloneElement(child as ReactElement<Record<string, unknown>>, {
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? listId : undefined,
    onClick: (e: MouseEvent) => {
      const props = child.props as {
        onClick?: (ev: MouseEvent) => void;
        disabled?: boolean;
      };
      props.onClick?.(e);
      if (e.defaultPrevented || props.disabled) return;
      e.preventDefault();
      toggle();
    },
    onKeyDown: (e: KeyboardEvent) => {
      const props = child.props as {
        onKeyDown?: (ev: KeyboardEvent) => void;
        disabled?: boolean;
      };
      props.onKeyDown?.(e);
      if (e.defaultPrevented || props.disabled) return;
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
    }
  });

  const selectedSet = new Set(selectedKeys);

  const menuList = (
    <ul
      id={listId}
      role="menu"
      className={clsx(
        'py-1',
        useSheet ? 'max-h-[70vh] overflow-y-auto' : 'max-h-80 overflow-y-auto'
      )}
    >
      {items.map((item) => {
        if (item.divider) {
          return (
            <li
              data-testid="DropdownMenuDivider"
              key={item.key}
              role="separator"
              className="my-1 border-t border-primary-border"
            />
          );
        }
        const selected = selectedSet.has(item.key);
        return (
          <li data-testid="DropdownMenuItem" key={item.key} role="none">
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              data-selected={selected || undefined}
              className={clsx(
                'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                useSheet && 'min-h-11 px-4 py-3 text-base',
                item.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-elevated cursor-pointer',
                item.danger && !item.disabled
                  ? 'text-red-600 hover:bg-red-500/10'
                  : selected
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-primary-text'
              )}
              onClick={() => handleSelect(item.key, item.disabled)}
            >
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const floatingMenu =
    open &&
    mounted &&
    createPortal(
      useSheet ? (
        <div
          data-testid={`${dataTestId}Sheet`}
          className="fixed inset-0 z-1100 flex flex-col justify-end"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 border-0 cursor-pointer"
            onClick={close}
          />
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            className={clsx(
              'relative z-1 rounded-t-2xl border border-primary-border bg-primary shadow-xl',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
              menuClassName
            )}
          >
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-primary-border" />
            </div>
            {menuList}
          </div>
        </div>
      ) : (
        <div
          ref={menuRef}
          data-testid={`${dataTestId}Menu`}
          style={
            coords
              ? {
                  position: 'fixed',
                  top: coords.top,
                  left: coords.left,
                  zIndex: 1100,
                  minWidth: coords.minWidth,
                  visibility: 'visible',
                  pointerEvents: 'auto'
                }
              : MEASURE_STYLE
          }
          className={clsx(
            'min-w-[10rem] rounded-lg border border-primary-border bg-primary shadow-lg overflow-hidden',
            menuClassName
          )}
        >
          {menuList}
        </div>
      ),
      document.body
    );

  return (
    <span
      ref={triggerWrapRef}
      data-testid={dataTestId}
      className={clsx('relative inline-flex max-w-full', className)}
    >
      {trigger}
      {floatingMenu}
    </span>
  );
}
