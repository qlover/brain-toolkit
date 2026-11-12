'use client';

import { BootstrapsProvider } from '@/uikit/components/BootstrapsProvider';
import { DialogUIHost } from '@/uikit/components/DialogUIHost';
import { PamFeedbackFab } from '@/uikit/components-app/feedback/PamFeedbackFab';

/**
 * Client root shell: bootstraps + toast/confirm host（antd-free）+ 全局反馈 FAB。
 */
export function ClientRootProvider(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <BootstrapsProvider>
      <DialogUIHost />
      {children}
      <PamFeedbackFab />
    </BootstrapsProvider>
  );
}
