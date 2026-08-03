import { COMMON_ADMIN_TITLE } from '../i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.docs-cli';

export type CliDocsI18nInterface = typeof cliDocsI18n;

export const cliDocsI18nNamespace = 'page_docs_cli';

export const cliDocsI18n = Object.freeze({
  title: i18nKeys.PAGE_DOCS_CLI_TITLE,
  description: i18nKeys.PAGE_DOCS_CLI_DESCRIPTION,
  content: i18nKeys.PAGE_DOCS_CLI_CONTENT,
  keywords: i18nKeys.PAGE_DOCS_CLI_KEYWORDS,
  intro: i18nKeys.PAGE_DOCS_CLI_INTRO,
  sectionInstall: i18nKeys.PAGE_DOCS_CLI_SECTION_INSTALL,
  installBody: i18nKeys.PAGE_DOCS_CLI_INSTALL_BODY,
  sectionLogin: i18nKeys.PAGE_DOCS_CLI_SECTION_LOGIN,
  loginBody: i18nKeys.PAGE_DOCS_CLI_LOGIN_BODY,
  sectionCommands: i18nKeys.PAGE_DOCS_CLI_SECTION_COMMANDS,
  commandsBody: i18nKeys.PAGE_DOCS_CLI_COMMANDS_BODY,
  sectionSync: i18nKeys.PAGE_DOCS_CLI_SECTION_SYNC,
  syncBody: i18nKeys.PAGE_DOCS_CLI_SYNC_BODY,
  sectionSensitive: i18nKeys.PAGE_DOCS_CLI_SECTION_SENSITIVE,
  sensitiveBody: i18nKeys.PAGE_DOCS_CLI_SENSITIVE_BODY,
  sectionNotes: i18nKeys.PAGE_DOCS_CLI_SECTION_NOTES,
  notesBody: i18nKeys.PAGE_DOCS_CLI_NOTES_BODY,
  linkOauth: i18nKeys.PAGE_DOCS_CLI_LINK_OAUTH,
  linkApi: i18nKeys.PAGE_DOCS_CLI_LINK_API,
  adminTitle: COMMON_ADMIN_TITLE
});
