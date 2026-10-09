import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface BrainCodeProps {
  value: string;
  /** Shows a copy button when set. */
  onCopy?: (value: string) => void;
  copyLabel?: string;
  className?: string;
}

/** Monospace chip for ids / URIs, optionally with a copy button. */
export function BrainCode({
  value,
  onCopy,
  copyLabel,
  className
}: BrainCodeProps) {
  return (
    <span data-testid="BrainCode" className={clsx('brain-code', className)}>
      <span className="min-w-0">{value}</span>
      {onCopy && (
        <button
          type="button"
          aria-label={copyLabel ?? 'Copy'}
          title={copyLabel}
          onClick={() => onCopy(value)}
        >
          <ClipboardDocumentIcon />
        </button>
      )}
    </span>
  );
}
