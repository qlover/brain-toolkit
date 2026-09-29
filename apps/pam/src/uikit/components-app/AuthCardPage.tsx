import { AppRoutePage } from '@/uikit/components-app/AppRoutePage';
import { ROUTE_LOGIN } from '@config/route';
import type { ReactNode } from 'react';

/** Centered single-card layout for auth side flows (forgot / reset password). */
export function AuthCardPage(props: {
  testId: string;
  appName: string;
  adminTitle: string;
  heading: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <AppRoutePage
      data-testid={props.testId}
      tt={{ title: props.appName, adminTitle: props.adminTitle }}
      showHeaderNav={false}
      showAuthButton={false}
      headerHref={ROUTE_LOGIN}
      mainProps={{
        className: 'bg-primary flex min-h-screen items-center justify-center'
      }}
    >
      <div className="w-full max-w-[420px] p-8 sm:p-12">
        <h2 className="text-primary-text mb-2 text-2xl font-semibold">
          {props.heading}
        </h2>
        <p className="text-secondary-text mb-6 text-sm leading-relaxed">
          {props.subtitle}
        </p>
        {props.children}
      </div>
    </AppRoutePage>
  );
}
