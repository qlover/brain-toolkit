'use client';

import { CopyOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { clsx } from 'clsx';

export function CopyableCredential(props: {
  value: string;
  onCopy: () => void;
  className?: string;
}) {
  const { value, onCopy, className } = props;

  return (
    <div className={clsx('flex items-center gap-2 min-w-0', className)}>
      <code className="flex-1 min-w-0 bg-secondary text-primary-text px-2 py-2 rounded-lg text-sm break-all font-mono border border-primary-border/40">
        {value}
      </code>
      <Button
        type="text"
        icon={<CopyOutlined />}
        onClick={onCopy}
        className="text-brand hover:text-brand-hover shrink-0"
        aria-label="Copy"
      />
    </div>
  );
}
