import { vi, beforeEach, expect } from 'vitest';

// 全局测试设置文件

// Mock 浏览器 API
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((cb: FrameRequestCallback) => setTimeout(cb, 16))
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn()
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// 设置默认的 DOM 环境
beforeEach(() => {
  // 清理 DOM
  document.body.innerHTML = '';
  
  // 重置所有 Mock
  vi.clearAllMocks();
});

// 全局错误处理
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// 扩展 expect 匹配器（如果需要）
expect.extend({
  toBeInDOM(received: HTMLElement) {
    const pass = document.body.contains(received);
    return {
      pass,
      message: () => 
        pass 
          ? `Expected element not to be in DOM`
          : `Expected element to be in DOM`
    };
  }
});

// 声明自定义匹配器类型
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeInDOM(): any;
    }
  }
} 