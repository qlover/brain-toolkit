import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import type { Plugin, ResolvedConfig } from 'vite';
import {
  writeFileSync,
  unlinkSync,
  mkdirSync,
  rmdirSync,
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
    rmdirSync(join(testDir, 'locales/zh'), { recursive: true });
    rmdirSync(join(testDir, 'locales/en'), { recursive: true });
    rmdirSync(join(testDir, 'locales'), { recursive: true });
    rmdirSync(testDir, { recursive: true });
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
});
