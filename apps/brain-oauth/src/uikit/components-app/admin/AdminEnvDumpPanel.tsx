'use client';

import { useState } from 'react';
import { BrainButton } from '@/uikit/components/brain/BrainButton';
import { BrainField } from '@/uikit/components/brain/BrainField';
import { useIOC } from '@/uikit/hook/useIOC';
import { ENV_DUMP_TOKEN_HEADER } from '@config/EnvDumpConfig';
import { I } from '@config/ioc-identifiter';
import { API_ADMIN_ENV_DUMP } from '@config/route';
import type { DialogHandler } from '@qlover/next-kit/client';

type EnvDumpResponseType = {
  readonly dotenv: string;
  readonly presentKeys: readonly string[];
  readonly missingKeys: readonly string[];
};

/**
 * 临时：在站点设置页导出运行中白名单环境变量（需 ENV_DUMP_* + admin）。
 * 用完后随 dump API 一并删除。
 */
export function AdminEnvDumpPanel() {
  const dialogHandler = useIOC(I.DialogHandler) as DialogHandler;
  const [token, setToken] = useState('');
  const [dotenv, setDotenv] = useState('');
  const [meta, setMeta] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onDump = async (): Promise<void> => {
    if (!token.trim()) {
      dialogHandler.error('请填写 ENV_DUMP_TOKEN');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ADMIN_ENV_DUMP, {
        method: 'GET',
        credentials: 'include',
        headers: {
          [ENV_DUMP_TOKEN_HEADER]: token.trim()
        }
      });
      const body = (await response.json()) as {
        readonly success?: boolean;
        readonly data?: EnvDumpResponseType;
        readonly message?: string;
      };
      if (!response.ok || !body.success || !body.data) {
        dialogHandler.error(
          body.message ?? '导出失败（未开开关 / token 错 / 非 admin）'
        );
        return;
      }
      setDotenv(body.data.dotenv);
      setMeta(
        `有值 ${body.data.presentKeys.length} 个；空缺 ${body.data.missingKeys.length} 个`
      );
      dialogHandler.success('已导出，可复制到 PAM 导入');
    } catch (error) {
      console.error('env dump failed:', error);
      dialogHandler.error('导出请求失败');
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async (): Promise<void> => {
    if (!dotenv) {
      return;
    }
    try {
      await navigator.clipboard.writeText(dotenv);
      dialogHandler.success('已复制到剪贴板');
    } catch {
      dialogHandler.error('复制失败，请手动全选');
    }
  };

  return (
    <div
      data-testid="AdminEnvDumpPanel"
      className="brain-card flat mt-6 space-y-3 border border-dashed border-amber-500/50 p-4"
    >
      <div>
        <h2 className="brain-title text-base">临时：导出系统环境变量</h2>
        <p className="brain-desc text-xs">
          需 Vercel 配置 <code>ENV_DUMP_ENABLED=1</code> 与{' '}
          <code>ENV_DUMP_TOKEN</code>。仅 Brain admin。用完请删代码并关掉开关。
        </p>
      </div>
      <BrainField
        id="env-dump-token"
        label="Dump token"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        type="password"
        autoComplete="off"
        placeholder="与 ENV_DUMP_TOKEN 一致"
      />
      <div className="flex flex-wrap gap-2">
        <BrainButton
          type="button"
          size="sm"
          auto
          disabled={loading}
          onClick={() => void onDump()}
        >
          {loading ? '导出中…' : '导出白名单变量'}
        </BrainButton>
        <BrainButton
          type="button"
          variant="ghost"
          size="sm"
          auto
          disabled={!dotenv}
          onClick={() => void onCopy()}
        >
          复制 dotenv
        </BrainButton>
      </div>
      {meta ? <p className="text-xs text-tertiary-text">{meta}</p> : null}
      {dotenv ? (
        <textarea
          readOnly
          value={dotenv}
          rows={14}
          className="w-full resize-y rounded-lg border border-primary-border bg-elevated p-2 font-mono text-xs"
        />
      ) : null}
    </div>
  );
}
