import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useEffect, useState, type InputHTMLAttributes } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function ResultPill({
  success,
  status
}: {
  success: boolean;
  status: number | null;
}) {
  return (
    <span
      data-testid="ResultPill"
      className={clsx('brain-pill sm', success ? 'ok' : 'danger')}
    >
      {status ?? (success ? 'OK' : 'ERR')}
    </span>
  );
}

export function LogMethod({ method }: { method: string }) {
  if (!method) return null;
  return (
    <span
      data-testid="LogMethod"
      className={clsx('brain-method', method !== 'GET' && 'post')}
    >
      {method}
    </span>
  );
}

export function AdminSearch(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label data-testid="AdminSearch" className="brain-search">
      <MagnifyingGlassIcon aria-hidden />
      <input type="search" {...props} />
    </label>
  );
}
