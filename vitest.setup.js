/**
 * Vitest setup file for test environment configuration
 *
 * This file is executed before running tests to set up the test environment.
 */

// Mock requestAnimationFrame for jsdom environment
if (typeof window !== 'undefined') {
  // Mock requestAnimationFrame to execute immediately in tests
  window.requestAnimationFrame = (callback) => {
    // Use setTimeout with 0 delay to ensure async execution
    const id = setTimeout(() => callback(Date.now()), 0);
    return id;
  };

  window.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };

  // Mock getComputedStyle to provide a proper implementation for jsdom
  // This fixes the "Not implemented: window.getComputedStyle" error from rc-util
  window.getComputedStyle = (element) => {
    // Return a complete CSSStyleDeclaration mock
    return {
      getPropertyValue: (prop) => {
        // Return default values for common properties used by rc-util
        if (prop === 'overflow' || prop === 'overflowX' || prop === 'overflowY') {
          return 'visible';
        }
        if (prop === 'width' || prop === 'height') {
          return '0px';
        }
        return '';
      },
      length: 0,
      cssText: '',
      item: () => '',
      removeProperty: () => '',
      setProperty: () => {},
      parentRule: null,
      cssFloat: '',
      // Add all standard CSS properties with empty values
      ...Object.fromEntries(
        ['display', 'position', 'top', 'left', 'right', 'bottom', 'margin', 'padding'].map(
          (prop) => [prop, '']
        )
      ),
      [Symbol.iterator]: function* () {}
    };
  };
}
