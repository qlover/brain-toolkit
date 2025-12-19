/**
 * caseConverter test-suite
 *
 * Coverage:
 * 1. snakeCaseToPascalCase - Convert snake_case to PascalCase
 * 2. snakeCaseToCamelCase  - Convert snake_case to camelCase with prefix
 * 3. Type inference        - Test TypeScript type-level transformations
 * 4. Edge cases            - Boundary conditions and special characters
 */

import { describe, it, expect } from 'vitest';
import {
  snakeCaseToPascalCase,
  snakeCaseToCamelCase,
  convertTagToPascalCase,
  convertTagToMethodName,
  type SnakeToPascal,
  type SnakeToPascalWithPrefix,
  type SnakeToCamel
} from '../src/utils/caseConverter';

describe('caseConverter', () => {
  describe('snakeCaseToPascalCase', () => {
    it('should convert simple snake_case to PascalCase', () => {
      expect(snakeCaseToPascalCase('test')).toBe('Test');
      expect(snakeCaseToPascalCase('test_case')).toBe('TestCase');
      expect(snakeCaseToPascalCase('test_case_name')).toBe('TestCaseName');
    });

    it('should preserve uppercase letters (like UI, API)', () => {
      expect(snakeCaseToPascalCase('gen_UI')).toBe('GenUI');
      expect(snakeCaseToPascalCase('test_API')).toBe('TestAPI');
      expect(snakeCaseToPascalCase('gen_UI_test')).toBe('GenUITest');
    });

    it('should handle prefix removal', () => {
      expect(snakeCaseToPascalCase('disable_gen_UI', 'disable_')).toBe('GenUI');
      expect(snakeCaseToPascalCase('disable_no_meeting_tab', 'disable_')).toBe(
        'NoMeetingTab'
      );
      expect(snakeCaseToPascalCase('enable_feature_x', 'enable_')).toBe(
        'FeatureX'
      );
      expect(snakeCaseToPascalCase('disable_android_asr', 'disable_')).toBe(
        'AndroidAsr'
      );
    });

    it('should handle prefix that does not exist in string', () => {
      expect(snakeCaseToPascalCase('test_case', 'disable_')).toBe('TestCase');
      expect(snakeCaseToPascalCase('gen_UI', 'enable_')).toBe('GenUI');
    });

    it('should handle empty prefix', () => {
      expect(snakeCaseToPascalCase('test_case', '')).toBe('TestCase');
      expect(snakeCaseToPascalCase('gen_UI', '')).toBe('GenUI');
    });

    it('should handle single word without underscore', () => {
      expect(snakeCaseToPascalCase('test')).toBe('Test');
      expect(snakeCaseToPascalCase('execution')).toBe('Execution');
    });

    it('should handle multiple underscores', () => {
      expect(snakeCaseToPascalCase('test__case')).toBe('TestCase');
      expect(snakeCaseToPascalCase('test___case')).toBe('TestCase');
    });

    it('should handle real-world examples', () => {
      expect(
        snakeCaseToPascalCase('disable_amazon_search_graphql', 'disable_')
      ).toBe('AmazonSearchGraphql');
      expect(snakeCaseToPascalCase('execution_agent')).toBe('ExecutionAgent');
      expect(snakeCaseToPascalCase('no_meeting_tab')).toBe('NoMeetingTab');
    });

    it('should handle edge cases', () => {
      expect(snakeCaseToPascalCase('')).toBe('');
      expect(snakeCaseToPascalCase('_')).toBe('');
      expect(snakeCaseToPascalCase('__')).toBe('');
    });

    it('should handle strings starting with underscore', () => {
      expect(snakeCaseToPascalCase('_test')).toBe('Test');
      expect(snakeCaseToPascalCase('_test_case')).toBe('TestCase');
    });

    it('should handle strings ending with underscore', () => {
      expect(snakeCaseToPascalCase('test_')).toBe('Test');
      expect(snakeCaseToPascalCase('test_case_')).toBe('TestCase');
    });
  });

  describe('snakeCaseToCamelCase', () => {
    it('should convert to camelCase with default "has" prefix', () => {
      expect(snakeCaseToCamelCase('test')).toBe('hasTest');
      expect(snakeCaseToCamelCase('test_case')).toBe('hasTestCase');
      expect(snakeCaseToCamelCase('gen_UI')).toBe('hasGenUI');
    });

    it('should convert with custom method prefix', () => {
      expect(snakeCaseToCamelCase('test', 'is')).toBe('isTest');
      expect(snakeCaseToCamelCase('test_case', 'get')).toBe('getTestCase');
      expect(snakeCaseToCamelCase('admin_role', 'check')).toBe(
        'checkAdminRole'
      );
    });

    it('should handle prefix removal with method prefix', () => {
      expect(snakeCaseToCamelCase('disable_gen_UI', 'has', 'disable_')).toBe(
        'hasGenUI'
      );
      expect(
        snakeCaseToCamelCase('disable_no_meeting_tab', 'has', 'disable_')
      ).toBe('hasNoMeetingTab');
      expect(snakeCaseToCamelCase('enable_feature_x', 'is', 'enable_')).toBe(
        'isFeatureX'
      );
    });

    it('should handle real-world examples', () => {
      expect(
        snakeCaseToCamelCase('disable_amazon_search_graphql', 'has', 'disable_')
      ).toBe('hasAmazonSearchGraphql');
      expect(snakeCaseToCamelCase('execution_agent', 'get')).toBe(
        'getExecutionAgent'
      );
    });

    it('should handle edge cases', () => {
      expect(snakeCaseToCamelCase('')).toBe('has');
      expect(snakeCaseToCamelCase('', 'is')).toBe('is');
      expect(snakeCaseToCamelCase('test', '')).toBe('Test');
    });

    it('should handle different method prefixes', () => {
      const testCases = [
        { prefix: 'has', expected: 'hasTest' },
        { prefix: 'is', expected: 'isTest' },
        { prefix: 'get', expected: 'getTest' },
        { prefix: 'set', expected: 'setTest' },
        { prefix: 'check', expected: 'checkTest' },
        { prefix: 'validate', expected: 'validateTest' }
      ];

      testCases.forEach(({ prefix, expected }) => {
        expect(snakeCaseToCamelCase('test', prefix)).toBe(expected);
      });
    });
  });

  describe('deprecated functions', () => {
    it('convertTagToPascalCase should work like snakeCaseToPascalCase', () => {
      expect(convertTagToPascalCase('test_case')).toBe('TestCase');
      expect(convertTagToPascalCase('disable_gen_UI', 'disable_')).toBe(
        'GenUI'
      );
    });

    it('convertTagToMethodName should work like snakeCaseToCamelCase', () => {
      expect(convertTagToMethodName('test_case')).toBe('hasTestCase');
      expect(convertTagToMethodName('test_case', 'is')).toBe('isTestCase');
      expect(convertTagToMethodName('disable_gen_UI', 'has', 'disable_')).toBe(
        'hasGenUI'
      );
    });
  });

  describe('type inference', () => {
    it('should infer correct PascalCase type', () => {
      // Type-level tests - these will fail at compile time if types are wrong
      type Test1 = SnakeToPascal<'test_case'>;
      type Test2 = SnakeToPascal<'gen_ui'>;
      type Test3 = SnakeToPascal<'no_meeting_tab'>;

      // Runtime verification
      const result1: Test1 = 'TestCase' as const;
      const result2: Test2 = 'GenUi' as const;
      const result3: Test3 = 'NoMeetingTab' as const;

      expect(result1).toBe('TestCase');
      expect(result2).toBe('GenUi');
      expect(result3).toBe('NoMeetingTab');
    });

    it('should infer correct PascalCase type with prefix removal', () => {
      type Test1 = SnakeToPascalWithPrefix<
        'disable_amazon_search_graphql',
        'disable_'
      >;
      type Test2 = SnakeToPascalWithPrefix<'enable_feature_x', 'enable_'>;

      const result1: Test1 = 'AmazonSearchGraphql' as const;
      const result2: Test2 = 'FeatureX' as const;

      expect(result1).toBe('AmazonSearchGraphql');
      expect(result2).toBe('FeatureX');
    });

    it('should infer correct camelCase type', () => {
      type Test1 = SnakeToCamel<'test_case', 'has', ''>;
      type Test2 = SnakeToCamel<'admin_role', 'check', ''>;
      type Test3 = SnakeToCamel<'disable_gen_ui', 'has', 'disable_'>;

      const result1: Test1 = 'hasTestCase' as const;
      const result2: Test2 = 'checkAdminRole' as const;
      const result3: Test3 = 'hasGenUi' as const;

      expect(result1).toBe('hasTestCase');
      expect(result2).toBe('checkAdminRole');
      expect(result3).toBe('hasGenUi');
    });

    it('should handle complex type transformations', () => {
      // Test recursive type transformation
      type Test1 = SnakeToPascal<'a_b_c_d_e'>;
      type Test2 = SnakeToPascal<'very_long_snake_case_name'>;

      const result1: Test1 = 'ABCDE' as const;
      const result2: Test2 = 'VeryLongSnakeCaseName' as const;

      expect(result1).toBe('ABCDE');
      expect(result2).toBe('VeryLongSnakeCaseName');
    });

    it('should infer types with function return values', () => {
      // Test that function return type inference works
      const result1 = snakeCaseToPascalCase('test_case' as const);
      const result2 = snakeCaseToPascalCase(
        'disable_gen_ui' as const,
        'disable_' as const
      );
      const result3 = snakeCaseToCamelCase(
        'test_case' as const,
        'has' as const
      );

      // TypeScript should infer specific string literal types
      // Note: These are runtime functions, so types are inferred as string
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
      expect(typeof result3).toBe('string');

      expect(result1).toBe('TestCase');
      expect(result2).toBe('GenUi');
      expect(result3).toBe('hasTestCase');
    });

    it('should support mapped type transformations', () => {
      // Test that types can be used in mapped types
      type TagArray = readonly [
        'disable_gen_ui',
        'disable_test',
        'disable_feature'
      ];
      type PascalCaseArray = {
        [K in TagArray[number]]: SnakeToPascalWithPrefix<K, 'disable_'>;
      };

      const mapped: PascalCaseArray = {
        disable_gen_ui: 'GenUi',
        disable_test: 'Test',
        disable_feature: 'Feature'
      };

      expect(mapped['disable_gen_ui']).toBe('GenUi');
      expect(mapped['disable_test']).toBe('Test');
      expect(mapped['disable_feature']).toBe('Feature');
    });

    it('should handle union types in type parameters', () => {
      // Test union type handling
      type Tag1 = 'disable_a' | 'disable_b';
      type Result1 = SnakeToPascalWithPrefix<Tag1, 'disable_'>;

      // Result should be: 'A' | 'B'
      const result1: Result1 = 'A';
      const result2: Result1 = 'B';

      expect(result1).toBe('A');
      expect(result2).toBe('B');
    });

    it('should support conditional type patterns', () => {
      // Test that types work with conditional types
      type HasPrefix<T extends string> = T extends `disable_${infer _}`
        ? true
        : false;

      type _Test1 = HasPrefix<'disable_gen_ui'>; // true
      type _Test2 = HasPrefix<'gen_ui'>; // false

      const test1: _Test1 = true;
      const test2: _Test2 = false;

      expect(test1).toBe(true);
      expect(test2).toBe(false);
    });

    it('should handle template literal types correctly', () => {
      // Test template literal type inference
      type Prefix = 'disable_';
      type Suffix = 'gen_ui';
      type Combined = `${Prefix}${Suffix}`; // 'disable_gen_ui'

      type Result = SnakeToPascalWithPrefix<Combined, Prefix>; // 'GenUi'

      const result: Result = 'GenUi';
      expect(result).toBe('GenUi');
    });

    it('should support generic type constraints', () => {
      // Test that generic constraints work
      function convertWithConstraint<T extends string>(
        str: T
      ): SnakeToPascal<T> {
        return snakeCaseToPascalCase(str) as SnakeToPascal<T>;
      }

      const result = convertWithConstraint('test_case' as const);
      expect(result).toBe('TestCase');
    });

    it('should handle empty string type', () => {
      // Test edge case: empty string
      type EmptyResult = SnakeToPascal<''>;

      const result: EmptyResult = '';
      expect(result).toBe('');
    });

    it('should support method prefix variations', () => {
      // Test different method prefixes
      type HasMethod = SnakeToCamel<'feature', 'has', ''>;
      type IsMethod = SnakeToCamel<'feature', 'is', ''>;
      type GetMethod = SnakeToCamel<'feature', 'get', ''>;
      type SetMethod = SnakeToCamel<'feature', 'set', ''>;

      const hasMethod: HasMethod = 'hasFeature';
      const isMethod: IsMethod = 'isFeature';
      const getMethod: GetMethod = 'getFeature';
      const setMethod: SetMethod = 'setFeature';

      expect(hasMethod).toBe('hasFeature');
      expect(isMethod).toBe('isFeature');
      expect(getMethod).toBe('getFeature');
      expect(setMethod).toBe('setFeature');
    });

    it('should handle type inference with array of tags', () => {
      // Test type inference with arrays
      const _tags = ['disable_a', 'disable_b', 'disable_c'] as const;

      type TagType = (typeof _tags)[number]; // 'disable_a' | 'disable_b' | 'disable_c'
      type MethodNames = SnakeToCamel<TagType, 'has', 'disable_'>;

      // MethodNames should be: 'hasA' | 'hasB' | 'hasC'
      const method1: MethodNames = 'hasA';
      const method2: MethodNames = 'hasB';
      const method3: MethodNames = 'hasC';

      expect(method1).toBe('hasA');
      expect(method2).toBe('hasB');
      expect(method3).toBe('hasC');
    });

    it('should preserve case in type transformations', () => {
      // Test that uppercase letters are preserved
      // Note: Runtime behavior preserves uppercase, but type-level is different
      const result1 = snakeCaseToPascalCase('gen_UI');
      const result2 = snakeCaseToPascalCase('test_API_call');

      expect(result1).toBe('GenUI');
      expect(result2).toBe('TestAPICall');
    });

    it('should support distributive conditional types', () => {
      // Test distributive behavior with unions
      type Tags = 'disable_a' | 'disable_b' | 'disable_c';
      type Methods = SnakeToCamel<Tags, 'has', 'disable_'>;

      // Methods should distribute over union: 'hasA' | 'hasB' | 'hasC'
      const methods: Methods[] = ['hasA', 'hasB', 'hasC'];

      expect(methods).toEqual(['hasA', 'hasB', 'hasC']);
    });

    it('should handle nested type transformations', () => {
      // Test nested type operations
      type Step1 = SnakeToPascal<'test_case'>; // 'TestCase'
      type Step2 = `has${Step1}`; // 'hasTestCase'

      const result: Step2 = 'hasTestCase';
      expect(result).toBe('hasTestCase');
    });
  });

  describe('complex scenarios', () => {
    it('should handle long snake_case strings', () => {
      const longString = 'this_is_a_very_long_test_case_name_with_many_words';
      const result = snakeCaseToPascalCase(longString);
      expect(result).toBe('ThisIsAVeryLongTestCaseNameWithManyWords');
    });

    it('should handle mixed case preservation', () => {
      expect(snakeCaseToPascalCase('test_UI_API_case')).toBe('TestUIAPICase');
      expect(snakeCaseToPascalCase('gen_UI_for_API')).toBe('GenUIForAPI');
    });

    it('should handle consecutive uppercase words', () => {
      expect(snakeCaseToPascalCase('API_UI_test')).toBe('APIUITest');
      expect(snakeCaseToPascalCase('test_API_UI')).toBe('TestAPIUI');
    });

    it('should handle numbers in snake_case', () => {
      expect(snakeCaseToPascalCase('test_case_123')).toBe('TestCase123');
      expect(snakeCaseToCamelCase('test_case_123', 'has')).toBe(
        'hasTestCase123'
      );
    });

    it('should handle special prefixes', () => {
      const prefixes = ['disable_', 'enable_', 'no_', 'has_', 'is_'];
      prefixes.forEach((prefix) => {
        const input = `${prefix}test_feature`;
        const result = snakeCaseToPascalCase(input, prefix);
        expect(result).toBe('TestFeature');
      });
    });
  });

  describe('performance and consistency', () => {
    it('should produce consistent results on multiple calls', () => {
      const input = 'disable_gen_UI';
      const result1 = snakeCaseToPascalCase(input, 'disable_');
      const result2 = snakeCaseToPascalCase(input, 'disable_');
      const result3 = snakeCaseToPascalCase(input, 'disable_');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe('GenUI');
    });

    it('should handle batch conversions correctly', () => {
      const inputs = [
        'disable_gen_UI',
        'disable_no_meeting_tab',
        'disable_amazon_search_graphql',
        'disable_android_asr'
      ];

      const results = inputs.map((input) =>
        snakeCaseToPascalCase(input, 'disable_')
      );

      expect(results).toEqual([
        'GenUI',
        'NoMeetingTab',
        'AmazonSearchGraphql',
        'AndroidAsr'
      ]);
    });
  });
});
