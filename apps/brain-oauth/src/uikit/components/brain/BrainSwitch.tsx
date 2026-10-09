import type { InputHTMLAttributes } from 'react';

export type BrainSwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
>;

/** Toggle switch; the track turns into the brand gradient when checked. */
export function BrainSwitch(props: BrainSwitchProps) {
  return (
    <span data-testid="BrainSwitch" className="brain-switch">
      <input type="checkbox" role="switch" {...props} />
      <span />
    </span>
  );
}
