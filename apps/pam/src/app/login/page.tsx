import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { i18nConfig, type LocaleType } from '@config/i18n';
import { ROUTE_LOGIN, withLocalePrefix } from '@config/route';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Resolves UI locale for locale-less aliases (`/login`).
 * Prefer NEXT_LOCALE cookie, then Accept-Language, then fallback.
 */
async function resolveAliasLocale(): Promise<LocaleType> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(i18nConfig.storageKey)?.value;
  if (
    fromCookie &&
    (i18nConfig.supportedLngs as readonly string[]).includes(fromCookie)
  ) {
    return fromCookie as LocaleType;
  }

  const accept = (await headers()).get('accept-language')?.toLowerCase() || '';
  if (accept.includes('zh')) {
    return 'zh';
  }

  return i18nConfig.fallbackLng;
}

/**
 * PRD `/login` alias — forwards to the localized auth login page.
 */
export default async function LoginAliasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      if (value[0]) qs.set(key, value[0]);
    } else if (value) {
      qs.set(key, value);
    }
  }
  const query = qs.toString();
  const locale = await resolveAliasLocale();
  const path = withLocalePrefix(ROUTE_LOGIN, locale);
  redirect(`${path}${query ? `?${query}` : ''}`);
}
