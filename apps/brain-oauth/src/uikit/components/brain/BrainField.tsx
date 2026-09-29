import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from 'react';

interface BrainFieldShellProps {
  id: string;
  label: ReactNode;
  /** Static text before the input, e.g. a phone country code. */
  leading?: ReactNode;
  /** Trailing control inside the underline, e.g. "send code". */
  action?: ReactNode;
  /** Text under the underline; shown in the error color when `invalid`. */
  help?: ReactNode;
  invalid?: boolean;
}

export interface BrainFieldProps
  extends BrainFieldShellProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {}

export interface BrainTextareaFieldProps
  extends Omit<BrainFieldShellProps, 'leading' | 'action'>,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {}

function BrainFieldShell({
  id,
  label,
  leading,
  action,
  help,
  invalid,
  children
}: BrainFieldShellProps & { children: ReactNode }) {
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
        {children}
        {action}
      </div>
      {help != null && (
        <div id={`${id}-help`} className="brain-field-help">
          {help}
        </div>
      )}
    </div>
  );
}

/** Underline input; the line turns into the brand gradient on focus. */
export function BrainField({
  id,
  label,
  leading,
  action,
  help,
  invalid,
  ...inputProps
}: BrainFieldProps) {
  return (
    <BrainFieldShell
      id={id}
      label={label}
      leading={leading}
      action={action}
      help={help}
      invalid={invalid}
    >
      <input
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={help != null ? `${id}-help` : undefined}
        {...inputProps}
      />
    </BrainFieldShell>
  );
}

/** Multi-line variant of `BrainField`. */
export function BrainTextareaField({
  id,
  label,
  help,
  invalid,
  ...textareaProps
}: BrainTextareaFieldProps) {
  return (
    <BrainFieldShell id={id} label={label} help={help} invalid={invalid}>
      <textarea
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={help != null ? `${id}-help` : undefined}
        {...textareaProps}
      />
    </BrainFieldShell>
  );
}
