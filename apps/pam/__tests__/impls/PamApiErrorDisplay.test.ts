import { ExecutorError } from '@qlover/fe-corekit/executor';
import { describe, expect, it, vi } from 'vitest';
import { PamApiErrorDisplay } from '@/impls/PamApiErrorDisplay';
import type { I18nServiceInterface } from '@qlover/next-kit/common';

function createI18n(table: Record<string, string>): I18nServiceInterface {
  return {
    t: (key: string) => table[key] ?? key
  } as I18nServiceInterface;
}

describe('PamApiErrorDisplay', () => {
  it('translates api id when catalog has the key', () => {
    const i18n = createI18n({
      'api:server__error': '服务器错误',
      'common:api_request_failed': '请求失败，请稍后重试'
    });
    const text = PamApiErrorDisplay.resolveFromId(i18n, 'api:server__error', {
      requestId: 'req-1',
      appendRequestId: true
    });
    expect(text.startsWith('服务器错误')).toBe(true);
    expect(text).toContain('requestId: req-1');
  });

  it('falls back when translation returns the bare api key', () => {
    const i18n = createI18n({
      'common:api_request_failed': '请求失败，请稍后重试'
    });
    const text = PamApiErrorDisplay.resolveFromId(i18n, 'api:server__error', {
      appendRequestId: false
    });
    expect(text).toBe('请求失败，请稍后重试');
    expect(text).not.toContain('api:server__error');
  });

  it('reads requestId from ExecutorError cause envelope', () => {
    const i18n = createI18n({
      'api:not_authorized': '未授权',
      'common:api_request_failed': '请求失败，请稍后重试'
    });
    const error = new ExecutorError('api:not_authorized', {
      id: 'api:not_authorized',
      success: false,
      requestId: 'req-envelope',
      message: 'api:not_authorized'
    });
    const text = PamApiErrorDisplay.resolveFromExecutorError(i18n, error);
    expect(text).toContain('未授权');
    expect(text).toContain('requestId: req-envelope');
  });

  it('uses English hard fallback when even common key is missing', () => {
    const i18n = createI18n({});
    const spy = vi.spyOn(i18n, 't');
    const text = PamApiErrorDisplay.resolveFromId(i18n, 'api:unknown_key', {
      appendRequestId: false
    });
    expect(spy).toHaveBeenCalled();
    expect(text).toBe('Request failed. Please try again later.');
  });
});
