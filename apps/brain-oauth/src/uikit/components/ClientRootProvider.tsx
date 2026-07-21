'use client';

import { BootstrapsProvider } from '@/uikit/components/BootstrapsProvider';
import { DialogUIHost } from '@/uikit/components/DialogUIHost';

/**
 * Client root shell: bootstraps + toast/confirm host (antd-free).
 */
export function ClientRootProvider(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <BootstrapsProvider>
      <DialogUIHost />
      {children}
    </BootstrapsProvider>
  );
}
