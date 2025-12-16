/**
 * Configuration options for ElementResizer
 */
export type ElementResizerOptions = {
  /**
   * Target element to be collapsed/expanded
   *
   * target 需要有 transition 属性，指定 width,height,top,left,right,bottom 的过渡
   */
  target?: HTMLElement;
  /**
   * The unit of the target element
   *
   * If not set, the unit will be "px"
   * @default "px"
   */
  unit?: string;
  /**
   * The placeholder element
   *
   * If true, the placeholder element will be automatically created
   * If false, the placeholder element will not be created
   * If provided, the placeholder element will be used
   */
  placeholder?: boolean | HTMLElement;
  /**
   * This class name will be added to the target element when it is expanded
   */
  expandClassName?: string;
  /**
   * This class name will be added to the target element when it is collapsed
   */
  collapseClassName?: string;
  /**
   * Animation duration in milliseconds (overrides CSS transition duration)
   */
  duration?: number;
  /**
   * The root element
   *
   * If not set, the root element will be the document.documentElement
   */
  root?: HTMLElement | Document | Window;

  /**
   * Get relative rect
   */
  getRelativeRect?: (
    target: HTMLElement,
    container?: HTMLElement | Document | Window
  ) => ElementResizerRect;
};

/**
 * Full target dimensions for expanded state
 */
const fullTarget = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%'
} as const;

/**
 * Rectangle properties for target element positioning and sizing
 */
export type ElementResizerRect = {
  top: string | number;
  right: string | number;
  bottom: string | number;
  left: string | number;
  width: string | number;
  height: string | number;
};

/**
 * Animation state enum for better state management
 */
export enum AnimationState {
  IDLE = 'idle',
  EXPANDING = 'expanding',
  EXPANDED = 'expanded',
  COLLAPSING = 'collapsing',
  COLLAPSED = 'collapsed'
}

function getDefaultRelativeRect(
  target: HTMLElement,
  container?: HTMLElement | Document | Window
): ElementResizerRect {
  const targetRect = target.getBoundingClientRect();

  const containerRect =
    container instanceof Window || container instanceof Document
      ? document.documentElement.getBoundingClientRect()
      : container
        ? (container as HTMLElement).getBoundingClientRect()
        : document.documentElement.getBoundingClientRect();

  // const scrollTop = container instanceof HTMLElement ? container.scrollTop : window.scrollY;
  // const scrollLeft = container instanceof HTMLElement ? container.scrollLeft : window.scrollX;

  const offsetTop = targetRect.top - containerRect.top;
  const offsetLeft = targetRect.left - containerRect.left;

  return {
    top: offsetTop,
    left: offsetLeft,
    width: targetRect.width,
    height: targetRect.height,
    right: offsetLeft + targetRect.width,
    bottom: offsetTop + targetRect.height
  };
}

/**
 * Can be used to trigger the collapse and expand of a target element
 *
 * @example
 * ```ts
 * const elementResizer = new ElementResizer({
 *   target: document.querySelector(".collapsible-target"),
 * });
 *
 * elementResizer.expand();
 * elementResizer.collapse();
 * ```
 *
 * @example
 * ```tsx
 * <div id="collapsible-root">
 *  <div id="list">
 *    <div id="item-1" class="collapsible-item">
 *      <div class="collapsible-item-content">
 *        <p>Hello, world!</p>
 *      </div>
 *
 *      <!-- manual placeholder -->
 *      <div id="item-1-placeholder"></div>
 *    </div>
 *
 *    <div id="item-2" class="collapsible-item">
 *      <div class="collapsible-item-content">
 *        <p>Hello, world 2!</p>
 *      </div>
 *
 *      <!-- auto placeholder -->
 *    </div>
 *  </div>
 * </div>
 * ```
 */
export class ElementResizer {
  /**
   * Cached placeholder element
   */
  private _placeholder: HTMLElement | null = null;
  /**
   * Stored target dimensions for collapse animation
   */
  private lastTargetRect: ElementResizerRect | null = null;
  /**
   * Stored placeholder height for restoration
   */
  private _lastPlaceholderHeight: string | number | null = null;
  /**
   * Current animation state
   */
  private _animationState: AnimationState = AnimationState.IDLE;
  /**
   * Animation timeout ID for cleanup
   */
  private _animationTimeoutId: number | null = null;

  constructor(protected options: ElementResizerOptions = {}) {}

  /**
   * Gets the target element
   * @throws {Error} If target is not available
   */
  public get target(): HTMLElement {
    const target = this.options.target;
    if (!target) {
      throw new Error('ElementResizer: target is required');
    }
    return target;
  }

  /**
   * Gets the current animation state
   */
  public get animationState(): AnimationState {
    return this._animationState;
  }

  /**
   * Checks if animation is currently in progress
   */
  public get isAnimating(): boolean {
    return (
      this._animationState === AnimationState.EXPANDING ||
      this._animationState === AnimationState.COLLAPSING
    );
  }

  /**
   * Gets or creates the placeholder element based on configuration
   * @returns The placeholder element or null if not configured
   */
  public getPlaceholder(): HTMLElement | null {
    const { placeholder } = this.options;

    // Return cached placeholder if available
    if (this._placeholder) {
      return this._placeholder;
    }

    // If placeholder is provided in options, use it
    if (placeholder instanceof HTMLElement) {
      return (this._placeholder = placeholder);
    }

    // If placeholder is not provided in options, or placeholder is not an HTMLElement,
    // or placeholder is not auto-created, return null
    if (this.isAutoCreatePlaceholder) {
      // Auto-create placeholder if not exists
      this._placeholder = this.createPlaceholder();
      return this._placeholder;
    }

    return null;
  }

  /**
   * Converts a value to the specified unit
   * @param value - Numeric value or string with unit
   * @returns Formatted string with unit
   */
  public toUnit(value: string | number): string {
    const { unit = 'px' } = this.options;

    // If value is a number, add the unit
    if (typeof value === 'number') {
      return `${value}${unit}`;
    }

    // If value is a string, check if it already has a unit
    if (typeof value === 'string') {
      // Check if the string already contains a unit (ends with letters or %)
      const hasUnit = /[a-zA-Z%]$/.test(value.trim());

      if (hasUnit) {
        return value;
      }

      // If no unit detected, add the default unit
      return `${value}${unit}`;
    }

    return `${value}${unit}`;
  }

  /**
   * Creates a placeholder element automatically
   * @returns The created placeholder element
   * @throws {Error} If target has no parent node
   */
  private createPlaceholder(): HTMLElement {
    const target = this.target;
    const placeholder = document.createElement('div');

    // Add some basic styling to make it invisible but maintain layout
    placeholder.style.cssText = `
      visibility: hidden;
      pointer-events: none;
      position: relative;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
    `;

    // Add data attribute for debugging
    placeholder.setAttribute('data-element-resizer-placeholder', 'true');

    // Insert placeholder right after the target element
    if (target.parentNode) {
      target.parentNode.insertBefore(placeholder, target.nextSibling);
    } else {
      throw new Error(
        'ElementResizer: Target element must have a parent node for auto-placeholder creation'
      );
    }

    return placeholder;
  }

  /**
   * Checks if placeholder should be auto-created
   */
  public get isAutoCreatePlaceholder(): boolean {
    const { placeholder } = this.options;
    return !(placeholder instanceof HTMLElement) && placeholder === true;
  }

  /**
   * Updates configuration options
   * @param options - Partial options to merge
   * @returns This instance for method chaining
   */
  public setOptions(options: Partial<ElementResizerOptions>): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Applies CSS properties to target element
   * @param target - Target element
   * @param values - CSS properties to apply
   */
  private assignTargetRect(
    target: HTMLElement,
    values: ElementResizerRect
  ): void {
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined) {
        target.style.setProperty(key, this.toUnit(value));
      }
    }
  }

  /**
   * Removes CSS properties from target element
   * @param target - Target element
   * @param values - CSS properties to remove
   */
  private removeTargetRect(
    target: HTMLElement,
    values: ElementResizerRect
  ): void {
    for (const key of Object.keys(values)) {
      target.style.removeProperty(key);
    }
  }

  /**
   * Gets computed dimensions of target element
   * @param target - Target element
   * @returns Current computed dimensions
   */
  public getRelativeRect(target: HTMLElement): ElementResizerRect {
    const _getRelativeRect = this.options.getRelativeRect;

    if (_getRelativeRect && typeof _getRelativeRect === 'function') {
      return _getRelativeRect(target, this.options.root);
    }

    return getDefaultRelativeRect(target, this.options.root);
  }

  /**
   * Expands the target element with smooth animation
   * @throws {Error} If already animating
   */
  public expand(): void {
    if (this.isAnimating) {
      console.warn('ElementResizer: Animation already in progress');
      return;
    }

    this._animationState = AnimationState.EXPANDING;

    const { expandClassName, collapseClassName } = this.options;

    try {
      // !!! Get real width, important for the transition
      const clientWidth = this.target.clientWidth;
      const clientHeight = this.target.clientHeight;

      // !!! Set position to absolute, important for the transition
      this.target.style.setProperty('position', 'absolute');

      // override width to get real width
      const lastTargetRect: ElementResizerRect = {
        ...this.getRelativeRect(this.target),
        width: clientWidth,
        height: clientHeight
      };

      // Apply current dimensions
      this.assignTargetRect(this.target, lastTargetRect);

      // fixed placeholder
      this.fixedPlaceholder(lastTargetRect);

      // Remove collapse class if present
      if (collapseClassName) {
        this.target.classList.remove(collapseClassName);
      }

      // Store dimensions for later collapse
      this.lastTargetRect = lastTargetRect;

      // Trigger expansion animation
      requestAnimationFrame(() => {
        if (expandClassName) {
          this.target.classList.add(expandClassName);
        }

        // Animate to full size
        this.assignTargetRect(this.target, fullTarget);

        this._animationState = AnimationState.EXPANDED;
      });
    } catch (error) {
      this._animationState = AnimationState.IDLE;
      throw error;
    }
  }

  public fixedCurrentTargetRect(): void {
    // If no placeholder exists, we can't perform the fixed positioning
    if (!this._placeholder) {
      return;
    }

    const placeholderRect = this.getRelativeRect(this._placeholder);
    const nowTargetRect = this.getRelativeRect(this.target);

    let styleTransitionProperty = this.target.style.transitionProperty;
    const inStyle = !!this.target.style.transitionProperty;

    if (!inStyle) {
      styleTransitionProperty = window.getComputedStyle(
        this.target
      ).transitionProperty;
    }

    // 关键：禁用transition，确保位置设置是瞬间的
    this.target.style.transitionProperty = 'none';

    // 瞬间设置当前实际位置（从fullTarget状态获取真实坐标）
    this.assignTargetRect(this.target, nowTargetRect);

    requestAnimationFrame(() => {
      // 重新启用transition
      if (inStyle) {
        this.target.style.transitionProperty = styleTransitionProperty;
      } else {
        this.target.style.removeProperty('transition-property');
      }

      // 现在开始平滑过渡到目标位置
      this.assignTargetRect(this.target, placeholderRect);
    });
  }

  /**
   * Collapses the target element with smooth animation
   * @throws {Error} If already animating or no previous expand state
   */
  public collapse(): void {
    if (this.isAnimating) {
      console.warn('ElementResizer: Animation already in progress');
      return;
    }

    if (!this.lastTargetRect) {
      console.warn(
        'ElementResizer: No previous expand state found. Call expand() first.'
      );
      return;
    }

    this._animationState = AnimationState.COLLAPSING;

    const { expandClassName, collapseClassName } = this.options;
    const duration =
      this.options.duration ?? this.getTransitionDuration(this.target);

    try {
      // Update dimensions if placeholder size changed
      if (this._placeholder) {
        // maybe placeholder width or height changed
        this.lastTargetRect = {
          ...this.lastTargetRect,
          width: this._placeholder.clientWidth,
          height: this._placeholder.clientHeight
        };
      }

      this.fixedCurrentTargetRect();

      // Add collapse class
      if (collapseClassName) {
        this.target.classList.add(collapseClassName);
      }

      // Clear any existing timeout
      if (this._animationTimeoutId) {
        clearTimeout(this._animationTimeoutId);
      }

      // await duration
      this._animationTimeoutId = window.setTimeout(() => {
        try {
          // Remove animation classes
          if (expandClassName) {
            this.target.classList.remove(expandClassName);
          }
          if (collapseClassName) {
            this.target.classList.remove(collapseClassName);
          }

          // Clean up styles and placeholder
          this.cleanup();

          // Restore original positioning
          this.target.style.removeProperty('position');

          this._animationState = AnimationState.COLLAPSED;
          this._animationTimeoutId = null;
        } catch (error) {
          console.error(
            'ElementResizer: Error during collapse cleanup:',
            error
          );
          this._animationState = AnimationState.IDLE;
        }
      }, duration);
    } catch (error) {
      this._animationState = AnimationState.IDLE;
      console.error('ElementResizer: Error during collapse:', error);
      throw error;
    }
  }

  /**
   * Cancels any ongoing animation and resets to idle state
   */
  public cancelAnimation(): void {
    if (this._animationTimeoutId) {
      clearTimeout(this._animationTimeoutId);
      this._animationTimeoutId = null;
    }
    this._animationState = AnimationState.IDLE;
  }

  /**
   * Clean up auto-created placeholder element
   *
   * If placeholder is not provided in options, or placeholder is not an HTMLElement,
   * or placeholder is not auto-created, do nothing
   */
  private cleanup(): void {
    this.unfixedPlaceholder();

    if (this.lastTargetRect) {
      this.removeTargetRect(this.target, this.lastTargetRect);
      // reset lastTargetRect
      this.lastTargetRect = null;
    }
  }

  /**
   * Get the transition duration of the target
   *
   * @param target
   * @returns ms (number without unit)
   */
  private getTransitionDuration(target: HTMLElement): number {
    const computedStyle = window.getComputedStyle(target);
    const transitionDuration = computedStyle.transitionDuration;

    // If not set transition duration, return 0
    if (!transitionDuration || transitionDuration === '0s') {
      return 0;
    }

    // Handle multiple transition durations (take the first one)
    const firstDuration = transitionDuration.split(',')[0].trim();
    // Parse the numeric part
    const numericValue = parseFloat(firstDuration);

    // Return 0 for invalid values
    if (isNaN(numericValue)) {
      return 0;
    }

    // Check the unit
    if (firstDuration.includes('ms')) {
      // ms unit, return the value directly
      return numericValue;
    } else if (firstDuration.includes('s')) {
      // s unit, convert to ms
      return numericValue * 1000;
    }

    // Default case (usually seconds)
    return numericValue * 1000;
  }

  /**
   * Sets up placeholder with target dimensions
   * @param targetRect - Target element dimensions
   */
  private fixedPlaceholder(targetRect: ElementResizerRect): void {
    const placeholder = this.getPlaceholder();

    if (placeholder) {
      // Save original placeholder height before modifying it
      if (this._lastPlaceholderHeight === null) {
        // Only save the original height on first call
        const currentHeight = placeholder.style.height;
        this._lastPlaceholderHeight = currentHeight || null;
      }
      placeholder.style.setProperty('height', this.toUnit(targetRect.height));
    }
  }

  /**
   * Restores or removes placeholder element
   */
  private unfixedPlaceholder(): void {
    // Remove auto-created placeholder
    if (this.isAutoCreatePlaceholder && this._placeholder) {
      if (this._placeholder.parentNode) {
        this._placeholder.parentNode.removeChild(this._placeholder);
      }
      this._placeholder = null;
      return;
    }

    // Restore manual placeholder dimensions
    if (this._placeholder) {
      if (this._lastPlaceholderHeight) {
        this._placeholder.style.setProperty(
          'height',
          this.toUnit(this._lastPlaceholderHeight)
        );
      } else {
        this._placeholder.style.removeProperty('height');
      }
    }

    this._lastPlaceholderHeight = null;
  }

  /**
   * Destroys the instance and cleans up all resources
   */
  public destroy(): void {
    this.cancelAnimation();
    this.cleanup();

    // Remove any remaining styles
    try {
      this.target.style.removeProperty('position');
    } catch {
      // do nothing
    }

    // Clean up references
    this._placeholder = null;
    this.lastTargetRect = null;
    this._lastPlaceholderHeight = null;
  }
}
