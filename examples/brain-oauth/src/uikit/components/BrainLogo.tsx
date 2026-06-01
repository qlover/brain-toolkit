import { clsx } from 'clsx';
import type { SVGAttributes } from 'react';

/** Inline brain logo; path synced with `public/logo.svg`. Uses `currentColor` for fill. */
export function BrainLogo({
  className,
  ...props
}: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      data-testid="BrainLogo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 490.16 371.96"
      aria-hidden
      fill="currentColor"
      className={clsx('shrink-0', className)}
      {...props}
    >
      <path
        d="M777.79,533.74c-77.45-7.06-134.42-44.33-166.64-117.19-8.59-19.42-17.07-38.9-25.83-58.24-6.25-13.79-22.34-18.15-34.77-9.56-6.35,4.38-12.44,9.13-18.73,13.6a30.94,30.94,0,0,1-34.33.94c-10.17-6.44-15.81-18.76-13.8-30.14,2.3-13,11.3-22.36,24.26-25a29.56,29.56,0,0,1,24.79,5.76c6.12,4.69,12,9.7,18.07,14.45C563.15,338,579.55,334.73,587,321c10.35-19.07,20.47-38.27,30.78-57.37,30-55.56,76-89.4,138.35-99.42A187.36,187.36,0,0,1,966.42,297.46c19.81,68.86-3.13,144.09-58,190.63a186.58,186.58,0,0,1-99.87,43.78C798.68,533.08,788.7,533.11,777.79,533.74Zm-127.35-191c-2.61,73.53,55.79,135.63,130.15,138.38S918,426,920.6,352.3,864.82,216.7,790.42,213.91,653.06,269,650.44,342.72Z"
        transform="translate(-483.29 -161.78)"
      />
    </svg>
  );
}
