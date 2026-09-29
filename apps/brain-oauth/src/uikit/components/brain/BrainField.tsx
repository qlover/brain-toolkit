import type { InputHTMLAttributes, ReactNode } from 'react';

export interface BrainFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
  /** Static text before the input, e.g. a phone country code. */
  leading?: ReactNode;
  /** Trailing control inside the underline, e.g. "send code". */
  action?: ReactNode;
  invalid?: boolean;
}

/** Underline input; the line turns into the brand gradient on focus. */
export function BrainField({
  id,
  label,
  leading,
  action,
  invalid,
  ...inputProps
}: BrainFieldProps) {
  return (
    <div
      data-testid="BrainField"
      className="brain-field"
      data-invalid={invalid || undefined}
    >
      <label htmlFor={id}>{label}</label>
      <div className="brain-field-row">
        {leading != null && (
          <span className="brain-field-prefix">{leading}</span>
        )}
        <input id={id} aria-invalid={invalid || undefined} {...inputProps} />
        {action}
      </div>
    </div>
  );
}
