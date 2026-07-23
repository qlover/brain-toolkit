import { clsx } from 'clsx';

/** Prototype `.field` — shared by PAMForm + environment blocks.
 *  Container / inputs use `bg-secondary` (= --color-bg-container).
 */
export const pamFormFieldClass = clsx(
  'w-full border border-primary-border rounded-[10px]',
  'bg-secondary text-primary-text',
  'px-3.5 py-2 text-sm',
  'transition-[border-color,box-shadow] duration-150',
  'focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/20',
  'touch-manipulation'
);

export const pamFormSelectClass = clsx(
  pamFormFieldClass,
  'appearance-none bg-no-repeat pr-8',
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238c959f' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")]",
  'bg-[length:12px_12px] bg-[right_12px_center]'
);

export const pamFormTextareaClass = clsx(
  pamFormFieldClass,
  'resize-y min-h-[60px]'
);

export const pamFormLabelClass =
  'block text-xs sm:text-sm font-semibold text-secondary-text mb-1';

export const pamFormMonoFieldClass = clsx(pamFormFieldClass, 'font-mono');
