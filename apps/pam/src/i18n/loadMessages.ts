import { useApiLocales } from '@config/common';

/** 运行时补拉 API locales 的上限；超时后回落静态 JSON，避免拖死 SSG 页。 */
const API_LOCALES_FETCH_TIMEOUT_MS = 8_000;

// Static locale loaders so the bundler can resolve the JSON modules
const localeLoaders: Record<
  string,
  () => Promise<{ default: Record<string, string> }>
> = {
  en: () => import('@locales/en.json'),
  zh: () => import('@locales/zh.json')
};

async function loadLocaleFromFile(
  locale: string
): Promise<Record<string, string>> {
  const loader = localeLoaders[locale];
  if (!loader) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  const mod = await loader();
  return mod.default;
}

/**
 * 是否允许向 `SITE_URL` 补拉词典。
 *
 * `next build` 的 `getStaticProps` 若请求本站（或已挂掉的旧部署），会无超时地
 * 卡住，触发 Next「page took more than 60 seconds」。构建期只用本包静态 JSON。
 */
export function shouldFetchApiLocalesAtRuntime(): boolean {
  if (!useApiLocales) {
    return false;
  }
  return process.env.NEXT_PHASE !== 'phase-production-build';
}

/**
 * 加载 i18n 消息。
 *
 * 始终以本构建生成的 JSON 为底。`useApiLocales` 且非 `next build` 时，再向
 * `SITE_URL/api/locales/json` 补全后台键（静态文案优先）；失败或超时回落静态。
 *
 * @param locale - 语言代码
 * @param namespace - 可选命名空间（单个或数组），过滤时保留前缀
 * @returns 翻译消息对象
 *
 * @example
 * ```ts
 * const allMessages = await loadMessages('en');
 * const commonMessages = await loadMessages('en', 'common');
 * const messages = await loadMessages('en', ['common', 'page_home']);
 * ```
 */
export async function loadMessages(
  locale: string,
  namespace?: string | string[]
): Promise<Record<string, string>> {
  // 始终以本构建 JSON 为底，避免 SITE_URL 仍指向旧部署时 SSG 烤进空命名空间。
  const staticMessages = await loadLocaleFromFile(locale);
  let allMessages: Record<string, string> = staticMessages;

  // API 可补全后台独有键；本构建静态文案优先，避免库里旧翻译盖住发版新句。
  if (shouldFetchApiLocalesAtRuntime()) {
    try {
      const SITE_URL = process.env.SITE_URL;
      if (!SITE_URL) {
        throw new Error('SITE_URL is not set');
      }

      const localeUrl = new URL(`${SITE_URL}/api/locales/json`);
      localeUrl.searchParams.set('locale', locale);
      const namespacesParam = serializeNamespaces(namespace);
      if (namespacesParam) {
        localeUrl.searchParams.set('namespaces', namespacesParam);
      }

      const response = await fetch(localeUrl.toString(), {
        signal: AbortSignal.timeout(API_LOCALES_FETCH_TIMEOUT_MS)
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch locale from API: ${response.statusText}`
        );
      }

      const fromApi = (await response.json()) as Record<string, string>;
      allMessages = { ...fromApi, ...staticMessages };
    } catch (error) {
      console.warn(`Failed to load locale from API for ${locale}`, error);
      allMessages = staticMessages;
    }
  }

  return filterMessagesByNamespace(allMessages, namespace);
}

function serializeNamespaces(
  namespace?: string | string[]
): string | undefined {
  if (!namespace) {
    return undefined;
  }
  const list = Array.isArray(namespace) ? namespace : [namespace];
  const joined = list
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
  return joined || undefined;
}

/**
 * 根据命名空间过滤消息，保留命名空间前缀
 *
 * @param messages - 所有消息对象
 * @param namespace - 可选的命名空间（单个字符串或字符串数组），如果提供则只返回该命名空间下的消息，保留命名空间前缀
 * @returns 过滤后的消息对象
 *
 * @example
 * ```ts
 * const allMessages = { "common:save": "Save", "common:cancel": "Cancel", "page_home:title": "Home" };
 *
 * // 单个命名空间
 * const commonMessages = filterMessagesByNamespace(allMessages, "common");
 * // 返回: { "common:save": "Save", "common:cancel": "Cancel" }
 *
 * // 多个命名空间
 * const messages = filterMessagesByNamespace(allMessages, ["common", "page_home"]);
 * // 返回: { "common:save": "Save", "common:cancel": "Cancel", "page_home:title": "Home" }
 * ```
 */
export function filterMessagesByNamespace(
  messages: Record<string, string>,
  namespace?: string | string[]
): Record<string, string> {
  // 如果没有指定命名空间，返回所有消息
  if (!namespace) {
    return messages;
  }

  // 将单个字符串转换为数组，统一处理
  const namespaces = Array.isArray(namespace) ? namespace : [namespace];
  const filteredMessages: Record<string, string> = {};

  // 遍历所有命名空间
  for (const ns of namespaces) {
    const namespacePrefix = `${ns}:`;

    for (const [key, value] of Object.entries(messages)) {
      if (key.startsWith(namespacePrefix)) {
        // 保留完整的键名（包括命名空间前缀）
        filteredMessages[key] = value;
      }
    }
  }

  return filteredMessages;
}
