import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'jsdom',
    
    // 全局设置
    globals: true,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/__mocks__/**'
      ]
    },
    
    // 测试文件匹配模式
    include: ['**/__tests__/**/*.{test,spec}.{js,ts}'],
    
    // 设置超时时间
    testTimeout: 10000,
    
    // 别名配置 - 用于包间依赖的 Mock
    alias: {
      '@brain-toolkit/element-sizer': resolve(__dirname, 'packages/element-sizer/__mocks__'),
      // 未来添加更多包时的配置示例
      // '@brain-toolkit/package-a': resolve(__dirname, 'packages/package-a/__mocks__'),
      // '@brain-toolkit/package-b': resolve(__dirname, 'packages/package-b/__mocks__'),
    },
    
    // 设置文件，用于全局测试配置
    setupFiles: ['./test/setup.ts']
  }
}); 