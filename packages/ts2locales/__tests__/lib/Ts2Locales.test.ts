import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi,
  type MockInstance
} from 'vitest';
import { Ts2Locales } from '../../src/lib/Ts2Locales';
import {
  writeFileSync,
  unlinkSync,
  mkdirSync,
  rmdirSync,
  existsSync,
  readFileSync
} from 'fs';
import { join } from 'path';

describe('Ts2Locales', () => {
  const testDir = join(__dirname, 'test-files');
  const sourceFile = join(testDir, 'constants.ts');
  const zhLocaleFile = join(testDir, 'locales/zh/test.json');
  const enLocaleFile = join(testDir, 'locales/en/test.json');
  let consoleWarnSpy: MockInstance;

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
    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should throw error when no locales provided', () => {
      expect(() => new Ts2Locales([])).toThrow(
        'At least one locale must be provided'
      );
    });

    it('should use default options when none provided', () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      expect(ts2locales['options'].localPrefix).toBe('local');
      expect(ts2locales['options'].descriptionKey).toBe('description');
    });

    it('should merge custom options with defaults', () => {
      const ts2locales = new Ts2Locales(['zh', 'en'], {
        localPrefix: 'i18n'
      });
      expect(ts2locales['options'].localPrefix).toBe('i18n');
      expect(ts2locales['options'].descriptionKey).toBe('description'); // Default value
    });
  });

  describe('parse', () => {
    it('should parse basic translation constants', () => {
      const content = `
/**
 * @description Basic translation
 * @localZh 基本翻译
 * @localEn Basic translation
 */
export const BASIC = 'test.basic';
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse(content);

      expect(result).toEqual([
        {
          key: 'BASIC',
          value: 'test.basic',
          description: 'Basic translation',
          localeZh: '基本翻译',
          localeEn: 'Basic translation'
        }
      ]);
    });

    it('should parse multiple constants in one file', () => {
      const content = `
/**
 * @description First constant
 * @localZh 第一个常量
 * @localEn First constant
 */
export const FIRST = 'test.first';

/**
 * @description Second constant
 * @localZh 第二个常量
 * @localEn Second constant
 */
export const SECOND = 'test.second';
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('FIRST');
      expect(result[1].key).toBe('SECOND');
    });

    it('should handle malformed JSDoc comments', () => {
      const content = `
/** @description Malformed comment
 * @localZh 错误格式
 * @localEn Wrong format
 * */
export const MALFORMED = 'test.malformed';

/**
 * @description
 * @localZh
 * @localEn
 */
export const EMPTY_TAGS = 'test.empty';
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Malformed comment');
      expect(result[1].description).toBe('');

      // Verify warnings
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Empty @description found for key "EMPTY_TAGS"'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Empty @localzh found for key "EMPTY_TAGS"'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Empty @localen found for key "EMPTY_TAGS"'
      );
    });

    it('should handle number value', () => {
      const content = `
/**
 * @description Number constant
 * @localZh 数字常量
 * @localEn Number constant
 */
export const NUMBER = 123;
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);

      try {
        ts2locales.parse(content);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe(
          'Invalid value for key "NUMBER": Only string literals are allowed, value: 123'
        );
      }
    });

    it('should handle object value', () => {
      const content = `
/**
 * @description Object constant
 * @localZh 对象常量
 * @localEn Object constant
 */
export const OBJECT = { key: 'value' };
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);

      try {
        ts2locales.parse(content);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe(
          'Invalid value for key "OBJECT": Object or array values are not allowed, value: {"key":"value"}'
        );
      }
    });

    it('should handle array value', () => {
      const content = `
/**
 * @description Array constant
 * @localZh 数组常量
 * @localEn Array constant
 */
export const ARRAY = [1, 2, 3];
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);

      try {
        ts2locales.parse(content);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe(
          'Invalid value for key "ARRAY": Object or array values are not allowed, value: [1, 2, 3]'
        );
      }
    });

    it('should handle function value', () => {
      const content = `
/**
 * @description Function constant
 * @localZh 函数常量
 * @localEn Function constant
 */
export const FUNCTION = () => {};
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);

      try {
        ts2locales.parse(content);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe(
          'Invalid value for key "FUNCTION": Object or array values are not allowed, value: () => {}'
        );
      }
    });

    it('should handle duplicate keys', () => {
      const content = `
/**
 * @description First definition
 * @localZh 第一个定义
 * @localEn First definition
 */
export const DUPLICATE = 'test.duplicate';

/**
 * @description Second definition
 * @localZh 第二个定义
 * @localEn Second definition
 */
export const DUPLICATE = 'test.duplicate.second';
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        key: 'DUPLICATE',
        value: 'test.duplicate.second',
        description: 'Second definition',
        localeZh: '第二个定义',
        localeEn: 'Second definition'
      });
    });

    it('should handle invalid file path', () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse('');
      expect(result).toEqual([]);
    });

    it('should handle invalid file path', () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse('');
      expect(result).toEqual([]);
    });

    it('The value should be output as is', () => {
      const content = `
/**
 * @description Test key
 * @localZh '''测试
 * @localEn Test
 */
export const TEST_KEY = 'test.key';
/**
 * @description Test key
 * @localZh 这里有\${length}个字符
 * @localEn There are \${length} characters here
 */
export const TEST_KEY_2 = 'test.key2';
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse(content);
      expect(result).toEqual([
        {
          description: 'Test key',
          key: 'TEST_KEY',
          localeEn: 'Test',
          localeZh: "'''测试",
          value: 'test.key'
        },
        {
          description: 'Test key',
          key: 'TEST_KEY_2',
          localeEn: 'There are ${length} characters here',
          localeZh: '这里有${length}个字符',
          value: 'test.key2'
        }
      ]);
    });

    it('should handle multiple locales, locale with metadata mismatch locale', () => {
      const content = `
/**
 * @description Test key
 * @localZh 测试
 * @localEn Test
 * @localEs Test-es
 */
export const TEST_KEY = 'test.key';
/**
 * @description Test key
 * @localZh 这里有\${length}个字符
 * @localEn There are \${length} characters here
 * @localEs There are \${length} characters here
 */
export const TEST_KEY2 = 'test.key2';
`;
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.parse(content);
      expect(result).toEqual([
        {
          description: 'Test key',
          key: 'TEST_KEY',
          localeZh: '测试',
          localeEn: 'Test',
          value: 'test.key'
        },
        {
          description: 'Test key',
          key: 'TEST_KEY2',
          localeZh: '这里有${length}个字符',
          localeEn: 'There are ${length} characters here',
          value: 'test.key2'
        }
      ]);
    });

    it('should handle multiple locales, locale with metadata match locale', () => {
      const content = `
/**
 * @description Test key
 * @localZh 测试
 * @localEn Test
 * @localEs Test-es
 */
export const TEST_KEY = 'test.key';
/**
 * @description Test key
 * @localZh 这里有\${length}个字符
 * @localEn There are \${length} characters here
 * @localEs There are \${length} characters here
 */
export const TEST_KEY2 = 'test.key2';
`;
      const ts2locales = new Ts2Locales(['zh', 'en', 'es']);
      const result = ts2locales.parse(content);
      expect(result).toEqual([
        {
          description: 'Test key',
          key: 'TEST_KEY',
          localeZh: '测试',
          localeEn: 'Test',
          localeEs: 'Test-es',
          value: 'test.key'
        },
        {
          description: 'Test key',
          key: 'TEST_KEY2',
          localeZh: '这里有${length}个字符',
          localeEn: 'There are ${length} characters here',
          localeEs: 'There are ${length} characters here',
          value: 'test.key2'
        }
      ]);
    });
  });

  describe('getSourceParseValue', () => {
    it('should read and parse source file correctly', () => {
      const content = `
/**
 * @description Test constant
 * @localZh 测试常量
 * @localEn Test constant
 */
export const TEST = 'test.constant';
`;
      writeFileSync(sourceFile, content);

      const ts2locales = new Ts2Locales(['zh', 'en']);
      const result = ts2locales.getSourceParseValue(sourceFile);

      expect(result).toEqual([
        {
          key: 'TEST',
          value: 'test.constant',
          description: 'Test constant',
          localeZh: '测试常量',
          localeEn: 'Test constant'
        }
      ]);
    });

    it('should throw error when source file does not exist', () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const nonExistentFile = join(testDir, 'nonexistent.ts');

      expect(() => ts2locales.getSourceParseValue(nonExistentFile)).toThrow();
    });
  });

  describe('create', () => {
    it('should create locale object from parse values', () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const sourceParseValues = [
        {
          key: 'TEST',
          value: 'test.constant',
          description: 'Test constant',
          localeZh: '测试常量',
          localeEn: 'Test constant'
        }
      ];

      const zhResult = ts2locales.create('zh', sourceParseValues);
      const enResult = ts2locales.create('en', sourceParseValues);

      expect(zhResult).toEqual({
        'test.constant': '测试常量'
      });
      expect(enResult).toEqual({
        'test.constant': 'Test constant'
      });
    });

    it('should use description as fallback when locale value is missing', () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const sourceParseValues = [
        {
          key: 'TEST',
          value: 'test.constant',
          description: 'Test constant',
          localeZh: '',
          localeEn: ''
        }
      ];

      const zhResult = ts2locales.create('zh', sourceParseValues);
      expect(zhResult).toEqual({
        'test.constant': 'Test constant'
      });
    });

    it('should handle multiple entries', () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const sourceParseValues = [
        {
          key: 'FIRST',
          value: 'test.first',
          description: 'First constant',
          localeZh: '第一个常量',
          localeEn: 'First constant'
        },
        {
          key: 'SECOND',
          value: 'test.second',
          description: 'Second constant',
          localeZh: '第二个常量',
          localeEn: 'Second constant'
        }
      ];

      const zhResult = ts2locales.create('zh', sourceParseValues);
      expect(zhResult).toEqual({
        'test.first': '第一个常量',
        'test.second': '第二个常量'
      });
    });
  });

  describe('generate', () => {
    it('should generate locale files from source file', async () => {
      const content = `
/**
 * @description Test constant
 * @localZh 测试常量
 * @localEn Test constant
 */
export const TEST = 'test.constant';
`;
      writeFileSync(sourceFile, content);

      const ts2locales = new Ts2Locales(['zh', 'en']);
      await ts2locales.generate({
        source: sourceFile,
        target: join(testDir, 'locales/{{lng}}/test.json')
      });

      const zhContent = readFileSync(zhLocaleFile, 'utf8');
      const enContent = readFileSync(enLocaleFile, 'utf8');

      expect(JSON.parse(zhContent)).toEqual({
        'test.constant': '测试常量'
      });
      expect(JSON.parse(enContent)).toEqual({
        'test.constant': 'Test constant'
      });
    });

    it('should handle multiple locales including non-matching metadata', async () => {
      const content = `
/**
 * @description Multi-locale test
 * @localZh 测试常量
 * @localEn Test constant
 * @localEs Constante de prueba
 * @localFr Constante de test
 */
export const TEST = 'test.constant';
`;
      writeFileSync(sourceFile, content);

      const ts2locales = new Ts2Locales(['zh', 'en', 'es']); // Only zh, en, es are configured
      await ts2locales.generate({
        source: sourceFile,
        target: join(testDir, 'locales/{{lng}}/test.json')
      });

      const zhContent = readFileSync(
        join(testDir, 'locales/zh/test.json'),
        'utf8'
      );
      const enContent = readFileSync(
        join(testDir, 'locales/en/test.json'),
        'utf8'
      );
      const esContent = readFileSync(
        join(testDir, 'locales/es/test.json'),
        'utf8'
      );

      expect(JSON.parse(zhContent)).toEqual({
        'test.constant': '测试常量'
      });
      expect(JSON.parse(enContent)).toEqual({
        'test.constant': 'Test constant'
      });
      expect(JSON.parse(esContent)).toEqual({
        'test.constant': 'Constante de prueba'
      });
    });

    it('should handle template literals in translations', async () => {
      const content = `
/**
 * @description Template test
 * @localZh 这里有\${count}个项目
 * @localEn There are \${count} items
 */
export const TEMPLATE = 'template.count';
`;
      writeFileSync(sourceFile, content);

      const ts2locales = new Ts2Locales(['zh', 'en']);
      await ts2locales.generate({
        source: sourceFile,
        target: join(testDir, 'locales/{{lng}}/test.json')
      });

      const zhContent = readFileSync(zhLocaleFile, 'utf8');
      const enContent = readFileSync(enLocaleFile, 'utf8');

      expect(JSON.parse(zhContent)).toEqual({
        'template.count': '这里有${count}个项目'
      });
      expect(JSON.parse(enContent)).toEqual({
        'template.count': 'There are ${count} items'
      });
    });

    it('should handle duplicate keys by using the last occurrence', async () => {
      const content = `
/**
 * @description First definition
 * @localZh 第一个定义
 * @localEn First definition
 */
export const DUPLICATE = 'test.duplicate';

/**
 * @description Second definition
 * @localZh 第二个定义
 * @localEn Second definition
 */
export const DUPLICATE = 'test.duplicate';
`;
      writeFileSync(sourceFile, content);

      const ts2locales = new Ts2Locales(['zh', 'en']);
      await ts2locales.generate({
        source: sourceFile,
        target: join(testDir, 'locales/{{lng}}/test.json')
      });

      const zhContent = readFileSync(zhLocaleFile, 'utf8');
      const enContent = readFileSync(enLocaleFile, 'utf8');

      expect(JSON.parse(zhContent)).toEqual({
        'test.duplicate': '第二个定义'
      });
      expect(JSON.parse(enContent)).toEqual({
        'test.duplicate': 'Second definition'
      });
    });

    it('should merge with existing locale files and handle duplicates', async () => {
      // Create existing locale files
      const existingZhContent = {
        'existing.key': '现有内容',
        'test.duplicate': '旧的重复内容'
      };
      const existingEnContent = {
        'existing.key': 'Existing content',
        'test.duplicate': 'Old duplicate content'
      };
      writeFileSync(zhLocaleFile, JSON.stringify(existingZhContent));
      writeFileSync(enLocaleFile, JSON.stringify(existingEnContent));

      // Create source file with new content including a duplicate key
      const content = `
/**
 * @description New constant
 * @localZh 新常量
 * @localEn New constant
 */
export const NEW = 'test.new';

/**
 * @description Duplicate key
 * @localZh 新的重复内容
 * @localEn New duplicate content
 */
export const DUPLICATE = 'test.duplicate';
`;
      writeFileSync(sourceFile, content);

      const ts2locales = new Ts2Locales(['zh', 'en']);
      await ts2locales.generate({
        source: sourceFile,
        target: join(testDir, 'locales/{{lng}}/test.json')
      });

      const zhContent = readFileSync(zhLocaleFile, 'utf8');
      const enContent = readFileSync(enLocaleFile, 'utf8');

      expect(JSON.parse(zhContent)).toEqual({
        'existing.key': '现有内容',
        'test.new': '新常量',
        'test.duplicate': '新的重复内容'
      });
      expect(JSON.parse(enContent)).toEqual({
        'existing.key': 'Existing content',
        'test.new': 'New constant',
        'test.duplicate': 'New duplicate content'
      });
    });

    it('should handle missing locale values by using description as fallback', async () => {
      const content = `
/**
 * @description Fallback test
 * @localZh
 * @localEn
 */
export const FALLBACK = 'test.fallback';

/**
 * @description Another fallback
 */
export const NO_TRANSLATIONS = 'test.no.translations';
`;
      writeFileSync(sourceFile, content);

      const ts2locales = new Ts2Locales(['zh', 'en']);
      await ts2locales.generate({
        source: sourceFile,
        target: join(testDir, 'locales/{{lng}}/test.json')
      });

      const zhContent = readFileSync(zhLocaleFile, 'utf8');
      const enContent = readFileSync(enLocaleFile, 'utf8');

      expect(JSON.parse(zhContent)).toEqual({
        'test.fallback': 'Fallback test',
        'test.no.translations': 'Another fallback'
      });
      expect(JSON.parse(enContent)).toEqual({
        'test.fallback': 'Fallback test',
        'test.no.translations': 'Another fallback'
      });

      // Verify warnings
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Empty @localzh found for key "FALLBACK"'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Empty @localen found for key "FALLBACK"'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Empty @localzh found for key "NO_TRANSLATIONS"'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Empty @localen found for key "NO_TRANSLATIONS"'
      );
    });

    it('should throw error when source file does not exist', async () => {
      const ts2locales = new Ts2Locales(['zh', 'en']);
      const nonExistentFile = join(testDir, 'nonexistent.ts');

      await expect(
        ts2locales.generate({
          source: nonExistentFile,
          target: join(testDir, 'locales/{{lng}}/test.json')
        })
      ).rejects.toThrow();
    });
  });
});
