/**
 * FeatureTags test-suite
 *
 * Coverage:
 * 1. constructor              - Initialization with feature tags
 * 2. getFeatureTags           - Get feature tags array
 * 3. setFeatureTags           - Set feature tags array
 * 4. has                      - Check feature tag existence (Brain web logic)
 * 5. disableFeatureTag        - Check if feature is disabled
 * 6. enableFeatureTag         - Check if feature is enabled
 * 7. Dynamic methods          - Dynamically generated checker methods
 * 8. createFeatureTags        - Factory function
 * 9. Guest user handling      - Guest user permission logic
 * 10. Edge cases              - Empty tags, undefined, special cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeatureTags,
  createFeatureTags,
  type DynamicFeatureTags,
  type DynamicFeatureTagsInterface,
  type FeatureTagsOptions
} from '../src/FeatureTags';
import { PRE_FEATURE_TAGS } from '../src/config/PreFeatureTags';
import type { BrainUserFeatureTagType } from '../src/types/BrainUserTypes';

describe('FeatureTags', () => {
  describe('constructor', () => {
    it('should create instance with feature tags', () => {
      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'test']
      });

      expect(tags).toBeInstanceOf(FeatureTags);
      expect(tags.getFeatureTags()).toEqual(['disable_gen_UI', 'test']);
    });

    it('should create instance with empty feature tags', () => {
      const tags = new FeatureTags({
        featureTags: []
      });

      expect(tags).toBeInstanceOf(FeatureTags);
      expect(tags.getFeatureTags()).toEqual([]);
    });

    it('should create instance with preFeatureTags', () => {
      const preFeatureTags = [
        'disable_gen_UI',
        'disable_no_meeting_tab',
        'test'
      ] as const;

      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags
      });

      expect(tags).toBeInstanceOf(FeatureTags);
      expect(tags.getFeatureTags()).toEqual(['disable_gen_UI']);
    });

    it('should generate dynamic methods from preFeatureTags', () => {
      const preFeatureTags = [
        'disable_gen_UI',
        'disable_no_meeting_tab'
      ] as const;

      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags
      }) as DynamicFeatureTags<typeof preFeatureTags>;

      // Dynamic methods should exist
      expect(typeof tags.hasGenUI).toBe('function');
      expect(typeof tags.hasNoMeetingTab).toBe('function');
    });
  });

  describe('getFeatureTags and setFeatureTags', () => {
    let tags: FeatureTags;

    beforeEach(() => {
      tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'test']
      });
    });

    it('should get feature tags', () => {
      expect(tags.getFeatureTags()).toEqual(['disable_gen_UI', 'test']);
    });

    it('should set feature tags', () => {
      tags.setFeatureTags(['disable_no_meeting_tab', 'execution_agent']);
      expect(tags.getFeatureTags()).toEqual([
        'disable_no_meeting_tab',
        'execution_agent'
      ]);
    });

    it('should replace feature tags when setting', () => {
      tags.setFeatureTags(['new_tag']);
      expect(tags.getFeatureTags()).toEqual(['new_tag']);
      expect(tags.getFeatureTags().length).toBe(1);
    });

    it('should set empty feature tags', () => {
      tags.setFeatureTags([]);
      expect(tags.getFeatureTags()).toEqual([]);
    });
  });

  describe('has method - Brain web logic', () => {
    let tags: FeatureTags;

    beforeEach(() => {
      tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'test']
      });
    });

    it('should return false when tag exists (disabled)', () => {
      // Brain web logic: if disable_xxx exists, user does NOT have permission
      expect(tags.has('disable_gen_UI')).toBe(false);
      expect(tags.has('test')).toBe(false);
    });

    it('should return true when tag does not exist (enabled)', () => {
      // Brain web logic: if disable_xxx does NOT exist, user HAS permission
      expect(tags.has('disable_no_meeting_tab')).toBe(true);
      expect(tags.has('disable_amazon_search_graphql')).toBe(true);
    });

    it('should return false for guest users', () => {
      // Guest users have no permissions
      expect(tags.has('disable_gen_UI', true)).toBe(false);
      expect(tags.has('disable_no_meeting_tab', true)).toBe(false);
      expect(tags.has('any_tag', true)).toBe(false);
    });

    it('should handle non-guest users correctly', () => {
      expect(tags.has('disable_gen_UI', false)).toBe(false);
      expect(tags.has('disable_no_meeting_tab', false)).toBe(true);
    });

    it('should handle undefined isGuest parameter', () => {
      expect(tags.has('disable_gen_UI')).toBe(false);
      expect(tags.has('disable_no_meeting_tab')).toBe(true);
    });
  });

  describe('disableFeatureTag method', () => {
    let tags: FeatureTags;

    beforeEach(() => {
      tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'test']
      });
    });

    it('should return true when tag exists', () => {
      expect(tags.disableFeatureTag('disable_gen_UI')).toBe(true);
      expect(tags.disableFeatureTag('test')).toBe(true);
    });

    it('should return false when tag does not exist', () => {
      expect(tags.disableFeatureTag('disable_no_meeting_tab')).toBe(false);
      expect(tags.disableFeatureTag('nonexistent')).toBe(false);
    });

    it('should work with any tag format', () => {
      tags.setFeatureTags(['enable_feature', 'custom_tag']);
      expect(tags.disableFeatureTag('enable_feature')).toBe(true);
      expect(tags.disableFeatureTag('custom_tag')).toBe(true);
    });
  });

  describe('enableFeatureTag method', () => {
    let tags: FeatureTags;

    beforeEach(() => {
      tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'test']
      });
    });

    it('should return false when tag exists (feature is disabled)', () => {
      expect(tags.enableFeatureTag('disable_gen_UI')).toBe(false);
      expect(tags.enableFeatureTag('test')).toBe(false);
    });

    it('should return true when tag does not exist (feature is enabled)', () => {
      expect(tags.enableFeatureTag('disable_no_meeting_tab')).toBe(true);
      expect(tags.enableFeatureTag('nonexistent')).toBe(true);
    });

    it('should return false for guest users', () => {
      expect(tags.enableFeatureTag('disable_no_meeting_tab', true)).toBe(false);
      expect(tags.enableFeatureTag('any_tag', true)).toBe(false);
    });

    it('should handle non-guest users correctly', () => {
      expect(tags.enableFeatureTag('disable_gen_UI', false)).toBe(false);
      expect(tags.enableFeatureTag('disable_no_meeting_tab', false)).toBe(true);
    });
  });

  describe('dynamic methods', () => {
    it('should generate hasGenUI method', () => {
      const preFeatureTags = ['disable_gen_UI'] as const;
      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags
      }) as DynamicFeatureTags<typeof preFeatureTags>;

      expect(typeof tags.hasGenUI).toBe('function');
      expect(tags.hasGenUI()).toBe(false); // Tag exists, so no permission
    });

    it('should generate hasNoMeetingTab method', () => {
      const preFeatureTags = ['disable_no_meeting_tab'] as const;
      const tags = new FeatureTags({
        featureTags: [],
        preFeatureTags
      }) as DynamicFeatureTags<typeof preFeatureTags>;

      expect(typeof tags.hasNoMeetingTab).toBe('function');
      expect(tags.hasNoMeetingTab()).toBe(true); // Tag doesn't exist, so has permission
    });

    it('should generate multiple dynamic methods', () => {
      const preFeatureTags = [
        'disable_gen_UI',
        'disable_no_meeting_tab',
        'disable_amazon_search_graphql'
      ] as const;

      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags
      }) as DynamicFeatureTags<typeof preFeatureTags>;

      expect(typeof tags.hasGenUI).toBe('function');
      expect(typeof tags.hasNoMeetingTab).toBe('function');
      expect(typeof tags.hasAmazonSearchGraphql).toBe('function');

      expect(tags.hasGenUI()).toBe(false); // Disabled
      expect(tags.hasNoMeetingTab()).toBe(true); // Enabled
      expect(tags.hasAmazonSearchGraphql()).toBe(true); // Enabled
    });

    it('should handle guest parameter in dynamic methods', () => {
      const preFeatureTags = ['disable_gen_UI'] as const;
      const tags = new FeatureTags({
        featureTags: [],
        preFeatureTags
      }) as DynamicFeatureTags<typeof preFeatureTags>;

      expect(tags.hasGenUI()).toBe(true); // Not guest, tag doesn't exist
      expect(tags.hasGenUI(false)).toBe(true); // Not guest, tag doesn't exist
      expect(tags.hasGenUI(true)).toBe(false); // Guest, no permissions
    });

    it('should work with PRE_FEATURE_TAGS', () => {
      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'disable_android_asr'],
        preFeatureTags: PRE_FEATURE_TAGS
      }) as DynamicFeatureTags<typeof PRE_FEATURE_TAGS>;

      // Check some predefined tags
      expect(typeof tags.hasGenUI).toBe('function');
      expect(typeof tags.hasAndroidAsr).toBe('function');
      expect(typeof tags.hasAmazonSearchGraphql).toBe('function');

      expect(tags.hasGenUI()).toBe(false); // Disabled
      expect(tags.hasAndroidAsr()).toBe(false); // Disabled
      expect(tags.hasAmazonSearchGraphql()).toBe(true); // Enabled
    });
  });

  describe('createFeatureTags factory', () => {
    it('should create FeatureTags with default PRE_FEATURE_TAGS', () => {
      const tags = createFeatureTags({
        featureTags: ['disable_gen_UI']
      });

      expect(tags).toBeInstanceOf(FeatureTags);
      expect(tags.getFeatureTags()).toEqual(['disable_gen_UI']);
    });

    it('should create FeatureTags with custom preFeatureTags', () => {
      const customTags = ['disable_gen_UI', 'disable_test'] as const;
      const tags = createFeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags: customTags
      });

      expect(tags).toBeInstanceOf(FeatureTags);
      expect(tags.getFeatureTags()).toEqual(['disable_gen_UI']);
    });

    it('should create FeatureTags with empty options', () => {
      const tags = createFeatureTags();

      expect(tags).toBeInstanceOf(FeatureTags);
      expect(tags.getFeatureTags()).toEqual([]);
    });

    it('should generate dynamic methods from factory', () => {
      const tags = createFeatureTags({
        featureTags: ['disable_gen_UI']
      });

      // Should have dynamic methods from PRE_FEATURE_TAGS
      expect(typeof tags.hasGenUI).toBe('function');
      expect(typeof tags.hasNoMeetingTab).toBe('function');
    });

    it('should work with type inference', () => {
      const customTags = ['disable_gen_UI', 'disable_test'] as const;
      const tags = createFeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags: customTags
      });

      // Type-safe dynamic methods
      expect(tags.hasGenUI()).toBe(false);
      expect(tags.hasTest()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty feature tags array', () => {
      const tags = new FeatureTags({
        featureTags: []
      });

      expect(tags.has('any_tag')).toBe(true); // No disabled tags, all enabled
      expect(tags.disableFeatureTag('any_tag')).toBe(false);
      expect(tags.enableFeatureTag('any_tag')).toBe(true);
    });

    it('should handle duplicate tags', () => {
      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'disable_gen_UI', 'test', 'test']
      });

      expect(tags.has('disable_gen_UI')).toBe(false);
      expect(tags.has('test')).toBe(false);
    });

    it('should handle tags without disable_ prefix', () => {
      const tags = new FeatureTags({
        featureTags: ['execution_agent', 'support_agent']
      });

      // These tags don't follow disable_ pattern
      expect(tags.has('execution_agent')).toBe(false); // Tag exists
      expect(tags.has('support_agent')).toBe(false); // Tag exists
      expect(tags.has('other_agent')).toBe(true); // Tag doesn't exist
    });

    it('should handle mixed tag formats', () => {
      const tags = new FeatureTags({
        featureTags: [
          'disable_gen_UI',
          'execution_agent',
          'enable_studios_onboarding'
        ]
      });

      expect(tags.has('disable_gen_UI')).toBe(false);
      expect(tags.has('execution_agent')).toBe(false);
      expect(tags.has('enable_studios_onboarding')).toBe(false);
      expect(tags.has('other_tag')).toBe(true);
    });

    it('should handle empty string tags', () => {
      const tags = new FeatureTags({
        featureTags: ['']
      });

      expect(tags.has('')).toBe(false);
      expect(tags.has('any_tag')).toBe(true);
    });

    it('should handle special characters in tags', () => {
      const tags = new FeatureTags({
        featureTags: ['disable_gen_UI', 'test-tag', 'test.tag']
      });

      expect(tags.has('disable_gen_UI')).toBe(false);
      expect(tags.has('test-tag')).toBe(false);
      expect(tags.has('test.tag')).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical user with some disabled features', () => {
      const tags = createFeatureTags({
        featureTags: [
          'disable_gen_UI',
          'disable_android_asr',
          'disable_studios_subscription'
        ]
      });

      // Disabled features
      expect(tags.hasGenUI()).toBe(false);
      expect(tags.hasAndroidAsr()).toBe(false);
      expect(tags.hasStudiosSubscription()).toBe(false);

      // Enabled features
      expect(tags.hasNoMeetingTab()).toBe(true);
      expect(tags.hasAmazonSearchGraphql()).toBe(true);
    });

    it('should handle user with all features enabled', () => {
      const tags = createFeatureTags({
        featureTags: []
      });

      // All features should be enabled
      expect(tags.hasGenUI()).toBe(true);
      expect(tags.hasNoMeetingTab()).toBe(true);
      expect(tags.hasAndroidAsr()).toBe(true);
    });

    it('should handle guest user scenario', () => {
      const tags = createFeatureTags({
        featureTags: []
      });

      // Guest users have no permissions
      expect(tags.hasGenUI(true)).toBe(false);
      expect(tags.hasNoMeetingTab(true)).toBe(false);
      expect(tags.hasAndroidAsr(true)).toBe(false);
    });

    it('should handle feature flag updates', () => {
      const tags = createFeatureTags({
        featureTags: ['disable_gen_UI']
      });

      expect(tags.hasGenUI()).toBe(false);

      // Update feature tags (e.g., after user upgrade)
      tags.setFeatureTags([]);
      expect(tags.hasGenUI()).toBe(true);

      // Disable again
      tags.setFeatureTags(['disable_gen_UI']);
      expect(tags.hasGenUI()).toBe(false);
    });

    it('should support permission checking pattern', () => {
      const tags = createFeatureTags({
        featureTags: ['disable_gen_UI', 'disable_studios_subscription']
      });

      // Check multiple permissions
      const permissions = {
        canUseGenUI: tags.hasGenUI(),
        canAccessStudios: tags.hasStudiosSubscription(),
        canUseMeetingTab: tags.hasNoMeetingTab()
      };

      expect(permissions).toEqual({
        canUseGenUI: false,
        canAccessStudios: false,
        canUseMeetingTab: true
      });
    });

    it('should handle experimental features', () => {
      const tags = createFeatureTags({
        featureTags: [
          'disable_experimental_image',
          'disable_studios_exp_features'
        ]
      });

      expect(tags.hasExperimentalImage()).toBe(false);
      expect(tags.hasStudiosExpFeatures()).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should accept FeatureTagsOptions parameter', () => {
      const options: FeatureTagsOptions<readonly string[]> = {
        featureTags: ['disable_gen_UI'],
        preFeatureTags: ['disable_gen_UI', 'disable_test'] as const
      };

      const tags = new FeatureTags(options);
      expect(tags.getFeatureTags()).toEqual(['disable_gen_UI']);
    });

    it('should work with const assertions', () => {
      const myTags = ['disable_gen_UI', 'disable_test'] as const;
      const tags = createFeatureTags({
        featureTags: ['disable_gen_UI'],
        preFeatureTags: myTags
      });

      expect(tags).toBeInstanceOf(FeatureTags);
    });

    it('should support BrainUserFeatureTagType', () => {
      const tag: BrainUserFeatureTagType = 'disable_gen_UI';
      const tags = new FeatureTags({
        featureTags: [tag]
      });

      expect(tags.has(tag)).toBe(false);
    });

    it('should infer generic type parameter correctly', () => {
      const customTags = ['disable_custom_a', 'disable_custom_b'] as const;

      // Type should be inferred as FeatureTags<readonly ['disable_custom_a', 'disable_custom_b']>
      const tags = new FeatureTags({
        featureTags: [],
        preFeatureTags: customTags
      });

      // Cast to DynamicFeatureTags to access dynamic methods
      const dynamicTags = tags as DynamicFeatureTags<typeof customTags>;

      expect(typeof dynamicTags.hasCustomA).toBe('function');
      expect(typeof dynamicTags.hasCustomB).toBe('function');
    });

    it('should maintain type safety with DynamicFeatureTags', () => {
      const tags = ['disable_feature_x', 'disable_feature_y'] as const;

      // Explicit type annotation
      const featureTags: DynamicFeatureTags<typeof tags> = createFeatureTags({
        featureTags: [],
        preFeatureTags: tags
      });

      expect(featureTags.hasFeatureX()).toBe(true);
      expect(featureTags.hasFeatureY()).toBe(true);
    });

    it('should support generic type constraints', () => {
      // Test that generic type extends readonly string[]
      const validTags = ['disable_a', 'disable_b'] as const;
      const tags1 = new FeatureTags<typeof validTags>({
        featureTags: [],
        preFeatureTags: validTags
      });

      expect(tags1).toBeInstanceOf(FeatureTags);
    });

    it('should infer DynamicFeatureTagsInterface correctly', () => {
      const testTags = ['disable_test_a', 'disable_test_b'] as const;

      // Type-level test: DynamicFeatureTagsInterface should have correct methods
      type _TestInterface = DynamicFeatureTagsInterface<typeof testTags>;

      const tags = createFeatureTags({
        featureTags: [],
        preFeatureTags: testTags
      });

      // Runtime verification
      expect(typeof tags.hasTestA).toBe('function');
      expect(typeof tags.hasTestB).toBe('function');
      expect(tags.hasTestA()).toBe(true);
      expect(tags.hasTestB()).toBe(true);
    });

    it('should handle complex generic type scenarios', () => {
      // Scenario 1: Empty readonly array
      const emptyTags = [] as const;
      const tags1 = createFeatureTags({
        featureTags: [],
        preFeatureTags: emptyTags
      });
      expect(tags1).toBeInstanceOf(FeatureTags);

      // Scenario 2: Single tag
      const singleTag = ['disable_single'] as const;
      const tags2 = createFeatureTags({
        featureTags: [],
        preFeatureTags: singleTag
      });
      expect(typeof tags2.hasSingle).toBe('function');

      // Scenario 3: Many tags
      const manyTags = [
        'disable_a',
        'disable_b',
        'disable_c',
        'disable_d'
      ] as const;
      const tags3 = createFeatureTags({
        featureTags: [],
        preFeatureTags: manyTags
      });
      expect(typeof tags3.hasA).toBe('function');
      expect(typeof tags3.hasB).toBe('function');
      expect(typeof tags3.hasC).toBe('function');
      expect(typeof tags3.hasD).toBe('function');
    });

    it('should preserve type information through factory function', () => {
      const myTags = ['disable_factory_test'] as const;

      // createFeatureTags should preserve generic type
      const tags = createFeatureTags({
        featureTags: [],
        preFeatureTags: myTags
      });

      // Should have type DynamicFeatureTags<typeof myTags>
      expect(typeof tags.hasFactoryTest).toBe('function');
      expect(tags.hasFactoryTest()).toBe(true);
    });

    it('should support type narrowing with const assertions', () => {
      // With const assertion - full type safety
      const tags = ['disable_a', 'disable_b'] as const;

      const featureTags = createFeatureTags({
        featureTags: [],
        preFeatureTags: tags // Must use const assertion for type safety
      });

      expect(typeof featureTags.hasA).toBe('function');
      expect(typeof featureTags.hasB).toBe('function');
    });

    it('should handle union types in generic parameters', () => {
      const tags = ['disable_union_a', 'disable_union_b'] as const;

      // Generic type should be: readonly ['disable_union_a', 'disable_union_b']
      const featureTags = createFeatureTags({
        featureTags: [],
        preFeatureTags: tags
      });

      // Each tag in the union should have a corresponding method
      expect(typeof featureTags.hasUnionA).toBe('function');
      expect(typeof featureTags.hasUnionB).toBe('function');
    });

    it('should maintain type safety with PRE_FEATURE_TAGS constant', () => {
      // PRE_FEATURE_TAGS is defined with 'as const'
      const tags = createFeatureTags({
        featureTags: [],
        preFeatureTags: PRE_FEATURE_TAGS
      });

      // Should have all methods from PRE_FEATURE_TAGS
      expect(typeof tags.hasGenUI).toBe('function');
      expect(typeof tags.hasAmazonSearchGraphql).toBe('function');
      expect(typeof tags.hasAndroidAsr).toBe('function');
      expect(typeof tags.hasNoMeetingTab).toBe('function');
    });

    it('should support generic type with default value', () => {
      // createFeatureTags has default generic type: typeof PRE_FEATURE_TAGS
      const tags1 = createFeatureTags(); // Uses default
      const tags2 = createFeatureTags({
        featureTags: []
      }); // Uses default

      // Both should have methods from PRE_FEATURE_TAGS
      expect(typeof tags1.hasGenUI).toBe('function');
      expect(typeof tags2.hasGenUI).toBe('function');
    });

    it('should handle readonly array type correctly', () => {
      // Test that readonly modifier is preserved
      const tags = ['disable_readonly_test'] as const;

      type TagsType = typeof tags; // Should be: readonly ['disable_readonly_test']

      const featureTags = createFeatureTags<TagsType>({
        featureTags: [],
        preFeatureTags: tags
      });

      expect(typeof featureTags.hasReadonlyTest).toBe('function');
    });

    it('should support explicit generic type annotation', () => {
      // Explicitly specify generic type
      const tags = ['disable_explicit'] as const;
      const featureTags = createFeatureTags<typeof tags>({
        featureTags: [],
        preFeatureTags: tags
      });

      expect(typeof featureTags.hasExplicit).toBe('function');
      expect(featureTags.hasExplicit()).toBe(true);
    });
  });
});
