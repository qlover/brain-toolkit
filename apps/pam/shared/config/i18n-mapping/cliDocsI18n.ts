import { COMMON_ADMIN_TITLE } from '../i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.docs-cli';

export type CliDocsI18nInterface = typeof cliDocsI18n;

export const cliDocsI18nNamespace = 'page_docs_cli';

export const cliDocsI18n = Object.freeze({
  title: i18nKeys.PAGE_DOCS_CLI_TITLE,
  description: i18nKeys.PAGE_DOCS_CLI_DESCRIPTION,
  content: i18nKeys.PAGE_DOCS_CLI_CONTENT,
  keywords: i18nKeys.PAGE_DOCS_CLI_KEYWORDS,
  adminTitle: COMMON_ADMIN_TITLE
});
