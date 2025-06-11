import { vi } from 'vitest';
import { ElementResizerOptions, AnimationState } from '../src';

export type { ElementResizerOptions, AnimationState } from '../src';

export class ElementResizer {
  target: HTMLElement;
  animationState: AnimationState = AnimationState.IDLE;
  isAnimating: boolean = false;

  constructor(options: ElementResizerOptions = {}) {
    this.target = options.target || document.createElement('div');
  }

  expand = vi.fn().mockImplementation(() => {
    this.animationState = AnimationState.EXPANDING;
    // 模拟异步动画
    setTimeout(() => {
      this.animationState = AnimationState.EXPANDED;
      this.isAnimating = false;
    }, 100);
    this.isAnimating = true;
    return Promise.resolve();
  });

  collapse = vi.fn().mockImplementation(() => {
    this.animationState = AnimationState.COLLAPSING;
    // 模拟异步动画
    setTimeout(() => {
      this.animationState = AnimationState.COLLAPSED;
      this.isAnimating = false;
    }, 100);
    this.isAnimating = true;
    return Promise.resolve();
  });

  fixedCurrentTargetRect = vi.fn().mockImplementation(() => {
    // Mock implementation
    return {
      width: 100,
      height: 100,
      top: 0,
      left: 0
    };
  });

  cancelAnimation = vi.fn().mockImplementation(() => {
    this.isAnimating = false;
    this.animationState = AnimationState.IDLE;
  });
}

// 默认导出
export default ElementResizer;

// 其他可能的工具函数 Mock
export const utils = {
  calculateSize: vi.fn().mockReturnValue({ width: 100, height: 100 }),
  animateElement: vi.fn().mockResolvedValue(true),
  getElementRect: vi.fn().mockReturnValue({
    width: 100,
    height: 100,
    top: 0,
    left: 0
  })
};
