import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import type { Plugin, ResolvedConfig } from 'vite';
import {
  writeFileSync,
  unlinkSync,
  mkdirSync,
  rmSync,
  existsSync,
  readFileSync
} from 'fs';
import ts2LocalesPlugin from '../../src/vite';

describe('vite-plugin-ts2locales', () => {
  const testDir = join(__dirname, 'test-files');
  const sourceFile = join(testDir, 'constants.ts');
  const zhLocaleFile = join(testDir, 'locales/zh/test.json');
  const enLocaleFile = join(testDir, 'locales/en/test.json');

  beforeEach(() => {
    // Create test directory structure
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    if (!existsSync(join(testDir, 'locales/zh'))) {
      mkdirSync(join(testDir, 'locales/zh'), { recursive: true });
    }
    if (!existsSync(join(testDir, 'locales/en'))) {
      mkdirSync(join(testDir, 'locales/en'), { recursive: true });
    }

    // Create test source file
    const content = `
/**
 * @description Test constant
 * @localZh 测试常量
 * @localEn Test constant
 */
export const TEST = 'test.constant';
`;
    writeFileSync(sourceFile, content);
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(sourceFile)) {
      unlinkSync(sourceFile);
    }
    if (existsSync(zhLocaleFile)) {
      unlinkSync(zhLocaleFile);
    }
    if (existsSync(enLocaleFile)) {
      unlinkSync(enLocaleFile);
    }
    // Remove test directories
    rmSync(join(testDir, 'locales/zh'), { recursive: true, force: true });
    rmSync(join(testDir, 'locales/en'), { recursive: true, force: true });
    rmSync(join(testDir, 'locales'), { recursive: true, force: true });
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should create plugin with default options', () => {
    const plugin = ts2LocalesPlugin();
    expect(plugin.name).toBe('vite-ts2locales');
  });

  it('should create plugin with custom locales', () => {
    const plugin = ts2LocalesPlugin({
      locales: ['fr', 'es']
    });
    expect(plugin.name).toBe('vite-ts2locales');
  });

  it('should generate locale files on configResolved', async () => {
    const plugin = ts2LocalesPlugin({
      options: [
        {
          source: sourceFile,
          target: join(testDir, 'locales/{{lng}}/test.json')
        }
      ]
    }) as Plugin;

    const mockConfig = {} as ResolvedConfig;
    const configResolvedHook = plugin.configResolved as (
      config: ResolvedConfig
    ) => Promise<void>;
    await configResolvedHook(mockConfig);

    // Verify generated files
    const zhContent = readFileSync(zhLocaleFile, 'utf8');
    const enContent = readFileSync(enLocaleFile, 'utf8');

    expect(JSON.parse(zhContent)).toEqual({
      'test.constant': '测试常量'
    });
    expect(JSON.parse(enContent)).toEqual({
      'test.constant': 'Test constant'
    });
  });

  it('should handle multiple source files', async () => {
    // Create another test file
    const sourceFile2 = join(testDir, 'constants2.ts');
    const content2 = `
/**
 * @description Another test
 * @localZh 另一个测试
 * @localEn Another test
 */
export const ANOTHER = 'test.another';
`;
    writeFileSync(sourceFile2, content2);

    const plugin = ts2LocalesPlugin({
      options: [
        {
          source: sourceFile,
          target: join(testDir, 'locales/{{lng}}/test.json')
        },
        {
          source: sourceFile2,
          target: join(testDir, 'locales/{{lng}}/test.json')
        }
      ]
    }) as Plugin;

    const mockConfig = {} as ResolvedConfig;
    const configResolvedHook = plugin.configResolved as (
      config: ResolvedConfig
    ) => Promise<void>;
    await configResolvedHook(mockConfig);

    // Verify generated files
    const zhContent = readFileSync(zhLocaleFile, 'utf8');
    const enContent = readFileSync(enLocaleFile, 'utf8');

    expect(JSON.parse(zhContent)).toEqual({
      'test.constant': '测试常量',
      'test.another': '另一个测试'
    });
    expect(JSON.parse(enContent)).toEqual({
      'test.constant': 'Test constant',
      'test.another': 'Another test'
    });

    // Clean up additional test file
    if (existsSync(sourceFile2)) {
      unlinkSync(sourceFile2);
    }
  });

  it('should support options as string array (source-only) with common target', async () => {
    const plugin = ts2LocalesPlugin({
      target: join(testDir, 'locales/{{lng}}/test.json'),
      options: [sourceFile]
    }) as Plugin;

    const mockConfig = {} as ResolvedConfig;
    const configResolvedHook = plugin.configResolved as (
      config: ResolvedConfig
    ) => Promise<void>;
    await configResolvedHook(mockConfig);

    const zhContent = readFileSync(zhLocaleFile, 'utf8');
    const enContent = readFileSync(enLocaleFile, 'utf8');
    expect(JSON.parse(zhContent)).toEqual({ 'test.constant': '测试常量' });
    expect(JSON.parse(enContent)).toEqual({ 'test.constant': 'Test constant' });
  });

  it('should support mixed options: string and object', async () => {
    const sourceFile2 = join(testDir, 'constants2.ts');
    writeFileSync(
      sourceFile2,
      `
/**
 * @description Second file
 * @localZh 第二文件
 * @localEn Second file
 */
export const SECOND = 'second.key';
`
    );

    const plugin = ts2LocalesPlugin({
      target: join(testDir, 'locales/{{lng}}/common.json'),
      options: [
        sourceFile,
        {
          source: sourceFile2,
          target: join(testDir, 'locales/{{lng}}/extra.json')
        }
      ]
    }) as Plugin;

    const configResolvedHook = plugin.configResolved as (
      config: ResolvedConfig
    ) => Promise<void>;
    await configResolvedHook({} as ResolvedConfig);

    expect(
      JSON.parse(readFileSync(join(testDir, 'locales/zh/common.json'), 'utf8'))
    ).toEqual({
      'test.constant': '测试常量'
    });
    expect(
      JSON.parse(readFileSync(join(testDir, 'locales/zh/extra.json'), 'utf8'))
    ).toEqual({
      'second.key': '第二文件'
    });
  });

  it('should apply common resolveNs and resolveKeyInFile when option is string', async () => {
    const nsSource = join(testDir, 'ns-constants.ts');
    writeFileSync(
      nsSource,
      `
/**
 * @description Default theme
 * @localZh 默认主题
 * @localEn Default Theme
 */
export const THEME_DEFAULT = 'common:theme.default';

/**
 * @description Dark theme
 * @localZh 深色主题
 * @localEn Dark Theme
 */
export const THEME_DARK = 'page:theme.dark';
`
    );

    const plugin = ts2LocalesPlugin({
      target: join(testDir, 'locales/{{lng}}/{{ns}}.json'),
      resolveNs: (key: string) => key.split(':')[0],
      resolveKeyInFile: (key: string, ns: string) => key.slice(ns.length + 1),
      options: [nsSource]
    }) as Plugin;

    const configResolvedHook = plugin.configResolved as (
      config: ResolvedConfig
    ) => Promise<void>;
    await configResolvedHook({} as ResolvedConfig);

    expect(
      JSON.parse(readFileSync(join(testDir, 'locales/zh/common.json'), 'utf8'))
    ).toEqual({
      'theme.default': '默认主题'
    });
    expect(
      JSON.parse(readFileSync(join(testDir, 'locales/zh/page.json'), 'utf8'))
    ).toEqual({
      'theme.dark': '深色主题'
    });
  });

  it('should throw when options include string but common target is missing', () => {
    expect(() =>
      ts2LocalesPlugin({
        options: [sourceFile]
      })
    ).toThrow(/target is required when options include a string/);
  });

  it('should throw when option object has no target and common target is missing', () => {
    expect(() =>
      ts2LocalesPlugin({
        options: [{ source: sourceFile }]
      })
    ).toThrow(/target is required/);
  });
});
