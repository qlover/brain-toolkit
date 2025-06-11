/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ElementResizer test suite
 *
 * Significance: Comprehensive testing for element resize animations
 * Core idea: Test all public methods and edge cases
 * Main function: Ensure ElementResizer works correctly
 * Main purpose: Validate animation behavior and state management
 *
 * @example
 * ```ts
 * import { describe, it, expect } from 'vitest';
 * import { ElementResizer, AnimationState } from '../src/index';
 * ```
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ElementResizer,
  AnimationState,
  type ElementResizerOptions,
  type ElementResizerRect
} from '../src/index';

// Mock DOM environment
const mockGetComputedStyle = vi.fn(() => ({
  transitionDuration: '300ms',
  transitionProperty: 'all'
}));

const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  setTimeout(callback, 16);
  return 1;
});

// Setup global mocks
Object.defineProperty(global, 'getComputedStyle', {
  value: mockGetComputedStyle,
  writable: true
});

Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

describe('ElementResizer', () => {
  let targetElement: HTMLElement;
  let containerElement: HTMLElement;
  let resizer: ElementResizer;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create DOM elements for testing
    document.body.innerHTML = '';

    // Ensure document.documentElement exists and has getBoundingClientRect
    const mockDocumentElement = document.createElement('html');
    mockDocumentElement.getBoundingClientRect = vi.fn(
      () =>
        ({
          top: 0,
          left: 0,
          width: 1024,
          height: 768,
          right: 1024,
          bottom: 768,
          x: 0,
          y: 0,
          toJSON: () => ({})
        }) as DOMRect
    );

    // Mock document.documentElement
    Object.defineProperty(document, 'documentElement', {
      value: mockDocumentElement,
      configurable: true,
      writable: true
    });

    containerElement = document.createElement('div');
    containerElement.style.cssText = `
      width: 500px;
      height: 400px;
      position: relative;
    `;

    targetElement = document.createElement('div');
    targetElement.style.cssText = `
      width: 200px;
      height: 100px;
      transition: all 300ms ease;
      background: red;
    `;

    containerElement.appendChild(targetElement);
    document.body.appendChild(containerElement);

    // Mock getBoundingClientRect for target element
    targetElement.getBoundingClientRect = vi.fn(
      () =>
        ({
          top: 50,
          left: 100,
          width: 200,
          height: 100,
          right: 300,
          bottom: 150,
          x: 100,
          y: 50,
          toJSON: () => ({})
        }) as DOMRect
    );

    // Mock getBoundingClientRect for container element
    containerElement.getBoundingClientRect = vi.fn(
      () =>
        ({
          top: 0,
          left: 0,
          width: 500,
          height: 400,
          right: 500,
          bottom: 400,
          x: 0,
          y: 0,
          toJSON: () => ({})
        }) as DOMRect
    );

    // Mock clientWidth and clientHeight
    Object.defineProperty(targetElement, 'clientWidth', {
      value: 200,
      configurable: true
    });
    Object.defineProperty(targetElement, 'clientHeight', {
      value: 100,
      configurable: true
    });

    // Reset computed style mock
    mockGetComputedStyle.mockReturnValue({
      transitionDuration: '300ms',
      transitionProperty: 'all'
    });
  });

  afterEach(() => {
    if (resizer) {
      resizer.destroy();
    }
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Constructor and Basic Properties', () => {
    it('should create instance with default options', () => {
      resizer = new ElementResizer();
      expect(resizer).toBeInstanceOf(ElementResizer);
      expect(resizer.animationState).toBe(AnimationState.IDLE);
      expect(resizer.isAnimating).toBe(false);
    });

    it('should create instance with target element', () => {
      resizer = new ElementResizer({ target: targetElement });
      expect(resizer.target).toBe(targetElement);
    });

    it('should throw error when accessing target without setting it', () => {
      resizer = new ElementResizer();
      expect(() => resizer.target).toThrow(
        'ElementResizer: target is required'
      );
    });

    it('should update options using setOptions', () => {
      resizer = new ElementResizer({ target: targetElement });
      const newOptions: Partial<ElementResizerOptions> = {
        unit: 'rem',
        expandClassName: 'expanded'
      };

      const result = resizer.setOptions(newOptions);
      expect(result).toBe(resizer); // Should return this for chaining
    });
  });

  describe('Unit Conversion', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
    });

    it('should convert number to px by default', () => {
      expect(resizer.toUnit(100)).toBe('100px');
    });

    it('should use custom unit', () => {
      resizer.setOptions({ unit: 'rem' });
      expect(resizer.toUnit(2)).toBe('2rem');
    });

    it('should preserve existing unit in string', () => {
      expect(resizer.toUnit('50%')).toBe('50%');
      expect(resizer.toUnit('10em')).toBe('10em');
    });

    it('should preserve percentage values', () => {
      resizer.setOptions({ unit: 'rem' });
      expect(resizer.toUnit('100%')).toBe('100%');
    });
  });

  describe('Placeholder Management', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
    });

    it('should return null when placeholder is not configured', () => {
      expect(resizer.getPlaceholder()).toBeNull();
    });

    it('should use provided placeholder element', () => {
      const placeholder = document.createElement('div');
      resizer.setOptions({ placeholder });
      expect(resizer.getPlaceholder()).toBe(placeholder);
    });

    it('should auto-create placeholder when placeholder is true', () => {
      resizer.setOptions({ placeholder: true });
      const placeholder = resizer.getPlaceholder();

      expect(placeholder).toBeInstanceOf(HTMLElement);
      expect(
        placeholder?.getAttribute('data-element-resizer-placeholder')
      ).toBe('true');
      expect(placeholder?.style.visibility).toBe('hidden');
      expect(placeholder?.style.pointerEvents).toBe('none');
    });

    it('should cache auto-created placeholder', () => {
      resizer.setOptions({ placeholder: true });
      const placeholder1 = resizer.getPlaceholder();
      const placeholder2 = resizer.getPlaceholder();

      expect(placeholder1).toBe(placeholder2);
    });

    it('should throw error when auto-creating placeholder without parent', () => {
      const orphanElement = document.createElement('div');
      const orphanResizer = new ElementResizer({
        target: orphanElement,
        placeholder: true
      });

      expect(() => orphanResizer.getPlaceholder()).toThrow(
        'ElementResizer: Target element must have a parent node for auto-placeholder creation'
      );
    });

    it('should identify auto-create placeholder correctly', () => {
      expect(resizer.isAutoCreatePlaceholder).toBe(false);

      resizer.setOptions({ placeholder: true });
      expect(resizer.isAutoCreatePlaceholder).toBe(true);

      const placeholder = document.createElement('div');
      resizer.setOptions({ placeholder });
      expect(resizer.isAutoCreatePlaceholder).toBe(false);
    });
  });

  describe('Relative Rect Calculation', () => {
    beforeEach(() => {
      resizer = new ElementResizer({
        target: targetElement,
        root: document.documentElement // 确保有有效的 root
      });
    });

    it('should calculate relative rect using default function', () => {
      const rect = resizer.getRelativeRect(targetElement);

      expect(rect).toEqual({
        top: 50,
        left: 100,
        width: 200,
        height: 100,
        right: 300,
        bottom: 150
      });
    });

    it('should use custom getRelativeRect function', () => {
      const customRect: ElementResizerRect = {
        top: 10,
        left: 20,
        width: 150,
        height: 80,
        right: 170,
        bottom: 90
      };

      resizer.setOptions({
        getRelativeRect: () => customRect
      });

      expect(resizer.getRelativeRect(targetElement)).toEqual(customRect);
    });
  });

  describe('Animation States', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
    });

    it('should start in IDLE state', () => {
      expect(resizer.animationState).toBe(AnimationState.IDLE);
      expect(resizer.isAnimating).toBe(false);
    });

    it('should detect animating states correctly', () => {
      // Mock the private _animationState property
      (resizer as any)._animationState = AnimationState.EXPANDING;
      expect(resizer.isAnimating).toBe(true);

      (resizer as any)._animationState = AnimationState.COLLAPSING;
      expect(resizer.isAnimating).toBe(true);

      (resizer as any)._animationState = AnimationState.EXPANDED;
      expect(resizer.isAnimating).toBe(false);

      (resizer as any)._animationState = AnimationState.COLLAPSED;
      expect(resizer.isAnimating).toBe(false);
    });
  });

  describe('Expand Animation', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
    });

    it('should expand element successfully', async () => {
      resizer.expand();

      expect(resizer.animationState).toBe(AnimationState.EXPANDING);
      expect(targetElement.style.position).toBe('absolute');

      // Wait for requestAnimationFrame
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(resizer.animationState).toBe(AnimationState.EXPANDED);
      expect(targetElement.style.width).toBe('100%');
      expect(targetElement.style.height).toBe('100%');
    });

    it('should warn when trying to expand while animating', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (resizer as any)._animationState = AnimationState.EXPANDING;
      resizer.expand();

      expect(consoleSpy).toHaveBeenCalledWith(
        'ElementResizer: Animation already in progress'
      );
      consoleSpy.mockRestore();
    });

    it('should add expand class name during expansion', async () => {
      resizer.setOptions({ expandClassName: 'expanded' });
      resizer.expand();

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(targetElement.classList.contains('expanded')).toBe(true);
    });

    it('should remove collapse class name during expansion', async () => {
      targetElement.classList.add('collapsed');
      resizer.setOptions({ collapseClassName: 'collapsed' });

      resizer.expand();

      expect(targetElement.classList.contains('collapsed')).toBe(false);
    });

    it('should create and fix placeholder during expansion', () => {
      resizer.setOptions({ placeholder: true });
      resizer.expand();

      const placeholder = resizer.getPlaceholder();
      expect(placeholder).toBeTruthy();
      expect(placeholder?.style.height).toBe('100px');
    });
  });

  describe('Collapse Animation', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
      // First expand to have a valid state for collapse
      resizer.expand();
    });

    it('should warn when trying to collapse without previous expand', () => {
      const freshResizer = new ElementResizer({ target: targetElement });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      freshResizer.collapse();

      expect(consoleSpy).toHaveBeenCalledWith(
        'ElementResizer: No previous expand state found. Call expand() first.'
      );
      consoleSpy.mockRestore();
    });

    it('should warn when trying to collapse while animating', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (resizer as any)._animationState = AnimationState.COLLAPSING;
      resizer.collapse();

      expect(consoleSpy).toHaveBeenCalledWith(
        'ElementResizer: Animation already in progress'
      );
      consoleSpy.mockRestore();
    });

    it('should start collapse animation', () => {
      // Manually set state to EXPANDED to simulate completed expand
      (resizer as any)._animationState = AnimationState.EXPANDED;

      resizer.collapse();

      expect(resizer.animationState).toBe(AnimationState.COLLAPSING);
    });

    it('should add collapse class name during collapse', () => {
      // Manually set state to EXPANDED to simulate completed expand
      (resizer as any)._animationState = AnimationState.EXPANDED;

      resizer.setOptions({ collapseClassName: 'collapsed' });
      resizer.collapse();

      expect(targetElement.classList.contains('collapsed')).toBe(true);
    });

    it('should complete collapse after duration', async () => {
      // Manually set state to EXPANDED to simulate completed expand
      (resizer as any)._animationState = AnimationState.EXPANDED;

      const duration = 100;
      resizer.setOptions({ duration });

      resizer.collapse();

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, duration + 50));

      expect(resizer.animationState).toBe(AnimationState.COLLAPSED);
      expect(targetElement.style.position).toBe('');
    });
  });

  describe('Animation Cancellation', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
    });

    it('should cancel ongoing animation', () => {
      resizer.expand();
      expect(resizer.isAnimating).toBe(true);

      resizer.cancelAnimation();
      expect(resizer.animationState).toBe(AnimationState.IDLE);
    });

    it('should clear animation timeout', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      resizer.expand();
      // Manually set state to EXPANDED to allow collapse to proceed
      (resizer as any)._animationState = AnimationState.EXPANDED;
      resizer.collapse();
      resizer.cancelAnimation();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Transition Duration Parsing', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
    });

    it('should parse milliseconds correctly', () => {
      mockGetComputedStyle.mockReturnValue({
        transitionDuration: '500ms'
      } as CSSStyleDeclaration);

      const duration = (resizer as any).getTransitionDuration(targetElement);
      expect(duration).toBe(500);
    });

    it('should parse seconds correctly', () => {
      mockGetComputedStyle.mockReturnValue({
        transitionDuration: '0.3s'
      } as CSSStyleDeclaration);

      const duration = (resizer as any).getTransitionDuration(targetElement);
      expect(duration).toBe(300);
    });

    it('should handle multiple transition durations', () => {
      mockGetComputedStyle.mockReturnValue({
        transitionDuration: '200ms, 400ms, 100ms'
      } as CSSStyleDeclaration);

      const duration = (resizer as any).getTransitionDuration(targetElement);
      expect(duration).toBe(200); // Should take the first one
    });

    it('should return 0 for no transition', () => {
      mockGetComputedStyle.mockReturnValue({
        transitionDuration: '0s'
      } as CSSStyleDeclaration);

      const duration = (resizer as any).getTransitionDuration(targetElement);
      expect(duration).toBe(0);
    });

    it('should return 0 for invalid values', () => {
      mockGetComputedStyle.mockReturnValue({
        transitionDuration: 'invalid'
      } as CSSStyleDeclaration);

      const duration = (resizer as any).getTransitionDuration(targetElement);
      expect(duration).toBe(0);
    });
  });

  describe('Cleanup and Destroy', () => {
    beforeEach(() => {
      resizer = new ElementResizer({
        target: targetElement,
        placeholder: true
      });
    });

    it('should clean up auto-created placeholder', () => {
      resizer.expand();
      const placeholder = resizer.getPlaceholder();
      expect(placeholder?.parentNode).toBeTruthy();

      resizer.destroy();
      expect(placeholder?.parentNode).toBeFalsy();
    });

    it('should restore manual placeholder', () => {
      const placeholder = document.createElement('div');
      placeholder.style.height = '50px';
      containerElement.appendChild(placeholder);

      resizer.setOptions({ placeholder });
      resizer.expand();

      // Placeholder height should be modified during expand
      expect(placeholder.style.height).toBe('100px');

      resizer.destroy();
      // Should be restored to original height
      expect(placeholder.style.height).toBe('50px');
    });

    it('should cancel animations on destroy', () => {
      resizer.expand();
      expect(resizer.isAnimating).toBe(true);

      resizer.destroy();
      expect(resizer.animationState).toBe(AnimationState.IDLE);
    });

    it('should remove all styles on destroy', () => {
      resizer.expand();
      expect(targetElement.style.position).toBe('absolute');

      resizer.destroy();
      expect(targetElement.style.position).toBe('');
    });

    it('should clear all references on destroy', () => {
      resizer.expand();
      resizer.destroy();

      expect((resizer as any)._placeholder).toBeNull();
      expect((resizer as any).lastTargetRect).toBeNull();
      expect((resizer as any)._lastPlaceholderHeight).toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      resizer = new ElementResizer({ target: targetElement });
    });

    it('should handle expand errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Mock an error during expand
      targetElement.getBoundingClientRect = vi.fn(() => {
        throw new Error('Mock error');
      });

      expect(() => resizer.expand()).toThrow('Mock error');
      expect(resizer.animationState).toBe(AnimationState.IDLE);

      consoleSpy.mockRestore();
    });

    it('should handle collapse errors gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // First expand successfully
      resizer.expand();

      // Manually set state to EXPANDED to ensure collapse can proceed
      (resizer as any)._animationState = AnimationState.EXPANDED;

      // Mock an error during collapse
      vi.spyOn(resizer, 'fixedCurrentTargetRect').mockImplementation(() => {
        throw new Error('Mock collapse error');
      });

      expect(() => resizer.collapse()).toThrow('Mock collapse error');
      expect(resizer.animationState).toBe(AnimationState.IDLE);

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle element without parent for auto placeholder', () => {
      const orphanElement = document.createElement('div');
      const orphanResizer = new ElementResizer({
        target: orphanElement,
        placeholder: true
      });

      expect(() => orphanResizer.getPlaceholder()).toThrow(
        'ElementResizer: Target element must have a parent node for auto-placeholder creation'
      );
    });

    it('should handle missing transition properties', () => {
      mockGetComputedStyle.mockReturnValue({
        transitionDuration: ''
      } as CSSStyleDeclaration);

      resizer = new ElementResizer({ target: targetElement });
      const duration = (resizer as any).getTransitionDuration(targetElement);
      expect(duration).toBe(0);
    });

    it('should handle placeholder size changes during collapse', () => {
      resizer = new ElementResizer({
        target: targetElement,
        placeholder: true
      });
      resizer.expand();

      // Manually set state to EXPANDED to ensure collapse can proceed
      (resizer as any)._animationState = AnimationState.EXPANDED;

      const placeholder = resizer.getPlaceholder();
      if (placeholder) {
        // Mock placeholder size change
        Object.defineProperty(placeholder, 'clientWidth', { value: 250 });
        Object.defineProperty(placeholder, 'clientHeight', { value: 120 });
      }

      resizer.collapse();

      // Should update lastTargetRect with new placeholder dimensions
      const lastRect = (resizer as any).lastTargetRect;
      expect(lastRect.width).toBe(250);
      expect(lastRect.height).toBe(120);
    });

    it('should handle target getter without target set', () => {
      const emptyResizer = new ElementResizer();

      expect(() => emptyResizer.target).toThrow(
        'ElementResizer: target is required'
      );
    });

    it('should handle methods that require target when target is not set', () => {
      const emptyResizer = new ElementResizer({ placeholder: true });

      // Methods that access this.target should throw error
      expect(() => emptyResizer.expand()).toThrow();
      expect(() => emptyResizer.getPlaceholder()).toThrow();
    });
  });
});
