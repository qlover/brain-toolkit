'use client';

import {
  ClipboardDocumentIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMEnvironmentsI18nInterface } from '@config/i18n-mapping/PAMEnvironmentsI18n';
import { I } from '@config/ioc-identifiter';

export type PAMProjectEnvUsageCardProps = {
  readonly projectSlug: string;
  readonly envName: string;
  /** Show the `pull` command (export permission). */
  readonly canExport: boolean;
  readonly tt: PAMEnvironmentsI18nInterface;
};

/**
 * Copyable `pamenv` commands for the selected environment.
 */
export function PAMProjectEnvUsageCard({
  projectSlug,
  envName,
  canExport,
  tt
}: PAMProjectEnvUsageCardProps) {
  const dialogHandler = useIOC(I.DialogHandler);

  const commands = [
    {
      id: 'run',
      command: `pamenv run ${projectSlug} -e ${envName} -- <command>`,
      hint: tt.usageRunHint
    },
    ...(canExport
      ? [
          {
            id: 'pull',
            command: `pamenv pull ${projectSlug} -e ${envName}`,
            hint: tt.usagePullHint
          }
        ]
      : [])
  ];

  const onCopy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      dialogHandler.success(tt.copied);
    } catch {
      // Clipboard can be blocked (insecure context); the text stays selectable.
    }
  };

  return (
    <div
      data-testid="PAMProjectEnvUsageCard"
      className="space-y-1.5 rounded-xl border border-primary-border bg-elevated/40 p-2.5 sm:space-y-2 sm:p-3"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary-text">
        <CommandLineIcon className="h-4 w-4 text-brand" />
        {tt.usageTitle}
      </div>
      {commands.map((item) => (
        <div
          data-testid="PAMProjectEnvUsageCard"
          key={item.id}
          className="space-y-0.5 sm:space-y-1"
        >
          <div className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-1.5 sm:px-2.5">
            <code
              title={item.hint}
              className="min-w-0 flex-1 truncate font-mono text-xs text-primary-text select-all sm:text-sm"
            >
              {item.command}
            </code>
            <button
              type="button"
              title={tt.copy}
              aria-label={tt.copy}
              onClick={() => void onCopy(item.command)}
              className="shrink-0 cursor-pointer rounded p-1 text-tertiary-text transition hover:bg-elevated hover:text-primary-text"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="hidden text-xs text-tertiary-text sm:block">
            {item.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
