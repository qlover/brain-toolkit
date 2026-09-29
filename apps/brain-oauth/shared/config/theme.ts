import type { ThemeConfig } from 'antd';

/**
 * @type {import('@qlover/corekit-bridge').ThemeConfig}
 *
 * App shell color theme is owned by `@wrksz/themes`.
 * `antdTheme` is retained for optional antd surfaces; the shell does not mount it.
 */
export const themeConfig = {
  domAttribute: 'data-theme',
  /**
   * If `enableSystem` is false, the default theme is light
   */
  defaultTheme: 'system',
  enableSystem: true,
  target: 'html',
  supportedThemes: ['light', 'dark'],
  storageKey: 'fe_theme',
  init: true,
  prioritizeStore: true,

  antdTheme: {
    cssVar: {
      key: 'fe-theme',
      prefix: 'fantd'
    }
  } as ThemeConfig
} as const;

/**
 * Brain visual palette, deep-merged over `@qlover/tailwind-theme` builtins by
 * `tools/generateAppThemeCss.ts`.
 *
 * Channel values are `R G B`; `color-sphere-shadow` is a full color because its
 * alpha differs per theme. Every supported theme must define the extra tokens
 * in {@link brainTokenMapping}, otherwise their utilities resolve to nothing.
 */
export const brainThemeTokens = {
  light: {
    'color-primary': '243 244 247',
    'color-secondary': '255 255 255',
    'color-elevated': '238 240 244',
    'color-primary-text': '43 47 58',
    'color-primary-text-hover': '107 114 128',
    'color-secondary-text': '107 114 128',
    'color-tertiary-text': '163 169 182',
    'color-primary-border': '223 226 232',
    'color-brand': '123 47 224',
    'color-brand-hover': '106 36 199',
    'color-brand-active': '90 28 172',
    'color-success': '#30a46c',
    'color-error': '#e5484d',
    'color-accent': '91 141 239',
    'color-inverse': '17 19 23',
    'color-on-inverse': '255 255 255',
    'color-card': '250 251 253',
    'color-disc': '233 234 239',
    'color-sphere-hi': '255 255 255',
    'color-sphere-lo': '228 230 236',
    'color-sphere-shadow': 'rgb(40 48 70 / 0.14)'
  },
  dark: {
    'color-primary': '14 15 18',
    'color-secondary': '34 37 43',
    'color-elevated': '27 29 34',
    'color-primary-text': '236 238 242',
    'color-primary-text-hover': '161 167 179',
    'color-secondary-text': '161 167 179',
    'color-tertiary-text': '125 132 148',
    'color-primary-border': '45 49 57',
    'color-brand': '157 107 245',
    'color-brand-hover': '139 84 240',
    'color-brand-active': '123 63 232',
    'color-success': '#3fb950',
    'color-error': '#f0686c',
    'color-accent': '111 156 245',
    'color-inverse': '243 244 247',
    'color-on-inverse': '17 19 23',
    'color-card': '26 28 33',
    'color-disc': '22 24 29',
    'color-sphere-hi': '74 78 87',
    'color-sphere-lo': '28 30 35',
    'color-sphere-shadow': 'rgb(0 0 0 / 0.5)'
  }
} satisfies Record<SupportedTheme, Record<string, string>>;

/** Tailwind `@theme` utilities for the extra Brain tokens (`bg-inverse`, `text-accent`, ...). */
export const brainTokenMapping = {
  'color-accent': 'rgb(var(--${prefix}-color-accent))',
  'color-inverse': 'rgb(var(--${prefix}-color-inverse))',
  'color-on-inverse': 'rgb(var(--${prefix}-color-on-inverse))',
  'color-card': 'rgb(var(--${prefix}-color-card) / 0.92)',
  'color-disc': 'rgb(var(--${prefix}-color-disc))',
  'color-sphere-hi': 'rgb(var(--${prefix}-color-sphere-hi))',
  'color-sphere-lo': 'rgb(var(--${prefix}-color-sphere-lo))',
  'color-sphere-shadow': 'var(--${prefix}-color-sphere-shadow)',
  'color-success': 'var(--${prefix}-color-success)',
  'color-error': 'var(--${prefix}-color-error)'
};

export type SupportedTheme = (typeof themeConfig.supportedThemes)[number];
export type CommonThemeConfig = typeof themeConfig;
