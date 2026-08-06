// src/i18n/request.ts

import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from './loadMessages';
import { routing, type Locale } from './routing';

// Export a function to configure next-intl on each request (server-side)
export default getRequestConfig(async ({ requestLocale }) => {
  // The incoming requestLocale typically matches the `[locale]` URL segment
  let locale = await requestLocale;

  // Ensure a valid, supported locale is always used
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
    timeZone: 'Asia/Shanghai',
    // 将 MISSING_MESSAGE 错误转换为警告
    onError: (error) => {
      if (
        error.code === 'MISSING_MESSAGE' ||
        error.code === 'ENVIRONMENT_FALLBACK' ||
        error.message.includes('MISSING_MESSAGE') ||
        error.message.includes('ENVIRONMENT_FALLBACK')
      ) {
        console.warn(`[i18n] ${error.code ?? 'warn'}: ${error.message}`);
        return;
      }
      throw error;
    }
  };
});
