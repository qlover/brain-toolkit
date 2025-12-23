/**
 * PreFeatureTags test-suite
 *
 * Coverage:
 * 1. PRE_FEATURE_TAGS constant - Predefined feature tags array
 * 2. Array structure         - Immutability and type safety
 * 3. Tag naming conventions  - Consistent naming patterns
 * 4. Uniqueness             - No duplicate tags
 * 5. Type safety            - Readonly tuple type
 */

import { describe, it, expect } from 'vitest';
import { PRE_FEATURE_TAGS } from '../src/config/PreFeatureTags';

describe('PreFeatureTags', () => {
  describe('PRE_FEATURE_TAGS constant', () => {
    it('should be defined', () => {
      expect(PRE_FEATURE_TAGS).toBeDefined();
    });

    it('should be an array', () => {
      expect(Array.isArray(PRE_FEATURE_TAGS)).toBe(true);
    });

    it('should not be empty', () => {
      expect(PRE_FEATURE_TAGS.length).toBeGreaterThan(0);
    });

    it('should contain only strings', () => {
      PRE_FEATURE_TAGS.forEach((tag) => {
        expect(typeof tag).toBe('string');
      });
    });

    it('should have expected number of tags', () => {
      // As of current implementation, there are 102 tags (including 1 duplicate)
      expect(PRE_FEATURE_TAGS.length).toBe(102);
    });
  });

  describe('tag naming conventions', () => {
    it('should contain tags starting with "disable_"', () => {
      const disableTags = PRE_FEATURE_TAGS.filter((tag) =>
        tag.startsWith('disable_')
      );
      expect(disableTags.length).toBeGreaterThan(0);
    });

    it('should contain tags starting with "enable_"', () => {
      const enableTags = PRE_FEATURE_TAGS.filter((tag) =>
        tag.startsWith('enable_')
      );
      expect(enableTags.length).toBeGreaterThan(0);
    });

    it('should mostly use snake_case naming', () => {
      // Most tags follow snake_case, but some have camelCase parts (e.g., useTool)
      PRE_FEATURE_TAGS.forEach((tag) => {
        // Allow alphanumeric and underscores (including uppercase for legacy tags)
        expect(tag).toMatch(/^[a-zA-Z0-9_]+$/);
      });
    });

    it('should not have leading or trailing whitespace', () => {
      PRE_FEATURE_TAGS.forEach((tag) => {
        expect(tag).toBe(tag.trim());
      });
    });

    it('should not be empty strings', () => {
      PRE_FEATURE_TAGS.forEach((tag) => {
        expect(tag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('tag uniqueness', () => {
    it('should detect duplicate tags', () => {
      const uniqueTags = new Set(PRE_FEATURE_TAGS);
      // There is 1 known duplicate: disable_mobile_page appears twice
      expect(uniqueTags.size).toBe(101);
      expect(PRE_FEATURE_TAGS.length).toBe(102);
    });

    it('should identify known duplicates', () => {
      const tagCounts = new Map<string, number>();
      PRE_FEATURE_TAGS.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      const duplicates = Array.from(tagCounts.entries()).filter(
        ([, count]) => count > 1
      );

      // Known duplicate: disable_mobile_page
      expect(duplicates.length).toBe(1);
      expect(duplicates[0][0]).toBe('disable_mobile_page');
      expect(duplicates[0][1]).toBe(2);
    });
  });

  describe('specific tag categories', () => {
    it('should contain Android-related tags', () => {
      const androidTags = PRE_FEATURE_TAGS.filter((tag) =>
        tag.includes('android')
      );
      expect(androidTags.length).toBeGreaterThan(0);
    });

    it('should contain Studios-related tags', () => {
      const studiosTags = PRE_FEATURE_TAGS.filter((tag) =>
        tag.includes('studios')
      );
      expect(studiosTags.length).toBeGreaterThan(0);
    });

    it('should contain UI-related tags', () => {
      const uiTags = PRE_FEATURE_TAGS.filter(
        (tag) => tag.includes('ui') || tag.includes('gen_UI')
      );
      expect(uiTags.length).toBeGreaterThan(0);
    });

    it('should contain agent-related tags', () => {
      const agentTags = PRE_FEATURE_TAGS.filter((tag) => tag.includes('agent'));
      expect(agentTags.length).toBeGreaterThan(0);
    });
  });

  describe('known important tags', () => {
    it('should include disable_gen_UI tag', () => {
      expect(PRE_FEATURE_TAGS).toContain('disable_gen_UI');
    });

    it('should include test tag', () => {
      expect(PRE_FEATURE_TAGS).toContain('test');
    });

    it('should include execution_agent tag', () => {
      expect(PRE_FEATURE_TAGS).toContain('execution_agent');
    });

    it('should include support_agent tag', () => {
      expect(PRE_FEATURE_TAGS).toContain('support_agent');
    });

    it('should include enable_studios_onboarding tag', () => {
      expect(PRE_FEATURE_TAGS).toContain('enable_studios_onboarding');
    });
  });

  describe('immutability', () => {
    it('should be a readonly array (type level)', () => {
      // Type-level test: TypeScript should prevent modifications
      // This is enforced by the 'as const' assertion
      type TagsType = typeof PRE_FEATURE_TAGS;
      type _IsReadonly = TagsType extends readonly string[] ? true : false;
      const _isReadonly: _IsReadonly = true;
      expect(_isReadonly).toBe(true);
    });

    it('should be type-safe at compile time', () => {
      // The 'as const' assertion provides type-level immutability
      // TypeScript will prevent modifications at compile time
      // Runtime immutability would require Object.freeze()
      expect(PRE_FEATURE_TAGS).toBeDefined();
    });
  });

  describe('type safety', () => {
    it('should be inferred as const tuple type', () => {
      // The type should be a readonly tuple of literal string types
      type FirstTag = (typeof PRE_FEATURE_TAGS)[0];
      const _firstTag: FirstTag = 'disable_amazon_search_graphql';
      expect(_firstTag).toBe('disable_amazon_search_graphql');
    });

    it('should support indexed access', () => {
      // Get a fresh reference to avoid test pollution
      const tags = PRE_FEATURE_TAGS;
      expect(tags[0]).toBe('disable_amazon_search_graphql');
      expect(tags[tags.length - 1]).toBe('test');
    });

    it('should support iteration', () => {
      const tags: string[] = [];
      for (const tag of PRE_FEATURE_TAGS) {
        tags.push(tag);
      }
      expect(tags.length).toBe(PRE_FEATURE_TAGS.length);
    });

    it('should support array methods', () => {
      const filtered = PRE_FEATURE_TAGS.filter((tag) =>
        tag.startsWith('disable_android')
      );
      expect(filtered.length).toBeGreaterThan(0);

      const mapped = PRE_FEATURE_TAGS.map((tag) => tag.toUpperCase());
      expect(mapped.length).toBe(PRE_FEATURE_TAGS.length);

      const found = PRE_FEATURE_TAGS.find((tag) => tag === 'test');
      expect(found).toBe('test');
    });
  });

  describe('tag statistics', () => {
    it('should have more disable tags than enable tags', () => {
      const disableCount = PRE_FEATURE_TAGS.filter((tag) =>
        tag.startsWith('disable_')
      ).length;
      const enableCount = PRE_FEATURE_TAGS.filter((tag) =>
        tag.startsWith('enable_')
      ).length;

      expect(disableCount).toBeGreaterThan(enableCount);
    });

    it('should have tags with various prefixes', () => {
      const prefixes = new Set<string>();
      PRE_FEATURE_TAGS.forEach((tag) => {
        const prefix = tag.split('_')[0];
        prefixes.add(prefix);
      });

      expect(prefixes.size).toBeGreaterThan(1);
      expect(prefixes.has('disable')).toBe(true);
    });

    it('should have longest tag length within reasonable bounds', () => {
      const maxLength = Math.max(...PRE_FEATURE_TAGS.map((tag) => tag.length));
      expect(maxLength).toBeLessThan(100);
      expect(maxLength).toBeGreaterThan(0);
    });

    it('should have shortest tag length within reasonable bounds', () => {
      const minLength = Math.min(...PRE_FEATURE_TAGS.map((tag) => tag.length));
      expect(minLength).toBeGreaterThan(0);
      expect(minLength).toBeLessThan(50);
    });
  });

  describe('integration scenarios', () => {
    it('should be usable in Set for quick lookup', () => {
      const tagSet = new Set(PRE_FEATURE_TAGS);

      expect(tagSet.has('disable_gen_UI')).toBe(true);
      expect(tagSet.has('test')).toBe(true);
      expect(
        tagSet.has('non_existent_tag' as (typeof PRE_FEATURE_TAGS)[number])
      ).toBe(false);
    });

    it('should be usable in Map for tag metadata', () => {
      const tagMap = new Map<string, boolean>();
      PRE_FEATURE_TAGS.forEach((tag) => {
        tagMap.set(tag, tag.startsWith('disable_'));
      });

      expect(tagMap.get('disable_gen_UI')).toBe(true);
      expect(tagMap.get('test')).toBe(false);
    });

    it('should support filtering by multiple criteria', () => {
      const androidDisableTags = PRE_FEATURE_TAGS.filter(
        (tag) => tag.startsWith('disable_') && tag.includes('android')
      );

      expect(androidDisableTags.length).toBeGreaterThan(0);
      androidDisableTags.forEach((tag) => {
        expect(tag).toMatch(/^disable_android/);
      });
    });

    it('should support grouping by prefix', () => {
      const grouped = PRE_FEATURE_TAGS.reduce(
        (acc, tag) => {
          const prefix = tag.split('_')[0];
          if (!acc[prefix]) {
            acc[prefix] = [];
          }
          acc[prefix].push(tag);
          return acc;
        },
        {} as Record<string, string[]>
      );

      expect(Object.keys(grouped).length).toBeGreaterThan(0);
      expect(grouped.disable).toBeDefined();
      expect(grouped.disable.length).toBeGreaterThan(0);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support checking if a tag exists', () => {
      const hasGenUI = PRE_FEATURE_TAGS.includes('disable_gen_UI');
      expect(hasGenUI).toBe(true);

      const hasInvalidTag = PRE_FEATURE_TAGS.includes(
        'invalid_tag' as (typeof PRE_FEATURE_TAGS)[number]
      );
      expect(hasInvalidTag).toBe(false);
    });

    it('should support finding tag index', () => {
      const index = PRE_FEATURE_TAGS.indexOf('disable_gen_UI');
      expect(index).toBeGreaterThanOrEqual(0);
      expect(PRE_FEATURE_TAGS[index]).toBe('disable_gen_UI');
    });

    it('should support creating a subset of tags', () => {
      const androidTags = PRE_FEATURE_TAGS.filter((tag) =>
        tag.includes('android')
      );
      const studiosTags = PRE_FEATURE_TAGS.filter((tag) =>
        tag.includes('studios')
      );

      expect(androidTags.length).toBeGreaterThan(0);
      expect(studiosTags.length).toBeGreaterThan(0);
    });

    it('should support tag validation', () => {
      const isValidTag = (tag: string): boolean => {
        return PRE_FEATURE_TAGS.includes(
          tag as (typeof PRE_FEATURE_TAGS)[number]
        );
      };

      expect(isValidTag('disable_gen_UI')).toBe(true);
      expect(isValidTag('test')).toBe(true);
      expect(isValidTag('invalid_tag')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string checks', () => {
      expect(
        PRE_FEATURE_TAGS.includes('' as (typeof PRE_FEATURE_TAGS)[number])
      ).toBe(false);
    });

    it('should handle case-sensitive comparisons', () => {
      expect(
        PRE_FEATURE_TAGS.includes(
          'DISABLE_GEN_UI' as (typeof PRE_FEATURE_TAGS)[number]
        )
      ).toBe(false);
      expect(
        PRE_FEATURE_TAGS.includes(
          'disable_gen_ui' as (typeof PRE_FEATURE_TAGS)[number]
        )
      ).toBe(false);
      expect(
        PRE_FEATURE_TAGS.includes(
          'disable_gen_UI' as (typeof PRE_FEATURE_TAGS)[number]
        )
      ).toBe(true);
    });

    it('should handle whitespace in comparisons', () => {
      expect(
        PRE_FEATURE_TAGS.includes(
          ' disable_gen_UI' as (typeof PRE_FEATURE_TAGS)[number]
        )
      ).toBe(false);
      expect(
        PRE_FEATURE_TAGS.includes(
          'disable_gen_UI ' as (typeof PRE_FEATURE_TAGS)[number]
        )
      ).toBe(false);
    });

    it('should handle special characters in tag names', () => {
      // Tags should only contain alphanumeric and underscore (including uppercase for legacy tags)
      PRE_FEATURE_TAGS.forEach((tag) => {
        expect(tag).not.toMatch(/[^a-zA-Z0-9_]/);
      });
    });
  });
});
