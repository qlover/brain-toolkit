'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import type { OAuthAuthorizeI18nInterface } from '@config/i18n-mapping/OAuthAuthorizeI18n';

export interface OAuthAuthorizeErrorCardProps {
  tt: OAuthAuthorizeI18nInterface;
  message: string;
}

export function OAuthAuthorizeErrorCard({
  tt,
  message
}: OAuthAuthorizeErrorCardProps) {
  return (
    <div data-testid="OAuthAuthorizeErrorCard" className="brain-card">
      <h1 className="brain-title">{tt.invalidTitle}</h1>
      <div
        role="alert"
        className="brain-note danger"
        style={{ margin: '20px 0 28px' }}
      >
        <ExclamationTriangleIcon />
        <span>{message}</span>
      </div>
      <BrainButton
        type="button"
        variant="ghost"
        onClick={() => window.history.back()}
      >
        {tt.back}
      </BrainButton>
    </div>
  );
}
