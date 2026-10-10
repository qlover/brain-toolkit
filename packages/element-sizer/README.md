# @brain-toolkit/element-sizer

一个强大的 DOM 元素展开/折叠动画工具，提供平滑的元素尺寸变化动画效果。

## 特性

- 🎬 平滑的展开/折叠动画效果
- 🎯 精确的元素定位和尺寸控制
- 🔧 TypeScript 完整支持
- 🎨 CSS 类名状态管理
- 📦 轻量级，无外部依赖
- 🌐 支持现代浏览器
- 🔄 自动占位符管理
- ⚡ 高性能动画实现
- 🃏 `ElementZoom`：iOS 风格展开卡片，附 React hook

## 安装

```bash
npm install @brain-toolkit/element-sizer
```

```bash
yarn add @brain-toolkit/element-sizer
```

```bash
pnpm add @brain-toolkit/element-sizer
```

## 快速开始

### 基础用法

```typescript
import { ElementResizer } from '@brain-toolkit/element-sizer';

// 获取目标元素
const targetElement = document.getElementById('collapsible-content');

// 创建 ElementResizer 实例
const resizer = new ElementResizer({
  target: targetElement,
  placeholder: true, // 自动创建占位符
  expandClassName: 'expanded',
  collapseClassName: 'collapsed'
});

// 展开元素
resizer.expand();

// 折叠元素
resizer.collapse();
```

### HTML 结构示例

```html
<div class="container">
  <button onclick="toggleElement()">切换显示</button>

  <div id="collapsible-content" class="collapsible-item">
    <div class="content">
      <h3>可折叠内容</h3>
      <p>这里是需要展开/折叠的内容...</p>
      <ul>
        <li>列表项 1</li>
        <li>列表项 2</li>
        <li>列表项 3</li>
      </ul>
    </div>
  </div>
</div>
```

### CSS 样式配置

```css
.collapsible-item {
  /* 必需：设置过渡动画 */
  transition: all 300ms ease-in-out;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 8px;
}

.collapsible-item.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

.collapsible-item.collapsed {
  opacity: 0.7;
  transform: scale(0.98);
}

.content {
  padding: 20px;
}
```

## API 文档

### ElementResizer 类

#### 构造函数

```typescript
new ElementResizer(options?: ElementResizerOptions)
```

#### 配置选项 (ElementResizerOptions)

```typescript
interface ElementResizerOptions {
  /** 目标元素 - 需要展开/折叠的元素 */
  target?: HTMLElement;

  /** 单位类型，默认为 "px" */
  unit?: string;

  /** 占位符配置
   * - true: 自动创建占位符
   * - false: 不使用占位符
   * - HTMLElement: 使用指定的占位符元素
   */
  placeholder?: boolean | HTMLElement;

  /** 展开状态时添加的 CSS 类名 */
  expandClassName?: string;

  /** 折叠状态时添加的 CSS 类名 */
  collapseClassName?: string;

  /** 动画持续时间（毫秒），覆盖 CSS transition 设置 */
  duration?: number;

  /** 根容器元素，用于计算相对位置 */
  root?: HTMLElement | Document | Window;

  /** 自定义相对位置计算函数 */
  getRelativeRect?: (
    target: HTMLElement,
    container?: HTMLElement | Document | Window
  ) => ElementResizerRect;
}
```

#### 属性

##### `target: HTMLElement`

获取目标元素。

```typescript
const targetElement = resizer.target;
```

##### `animationState: AnimationState`

获取当前动画状态。

```typescript
import { AnimationState } from '@brain-toolkit/element-sizer';

console.log(resizer.animationState);
// 可能的值: 'idle' | 'expanding' | 'expanded' | 'collapsing' | 'collapsed'
```

##### `isAnimating: boolean`

检查是否正在执行动画。

```typescript
if (!resizer.isAnimating) {
  resizer.expand();
}
```

#### 方法

##### `expand(): void`

展开目标元素。

```typescript
resizer.expand();
```

##### `collapse(): void`

折叠目标元素。

```typescript
resizer.collapse();
```

##### `fixedCurrentTargetRect(): void`

固定当前目标元素的位置和尺寸。

```typescript
resizer.fixedCurrentTargetRect();
```

##### `cancelAnimation(): void`

取消当前正在进行的动画。

```typescript
resizer.cancelAnimation();
```

##### `setOptions(options: Partial<ElementResizerOptions>): ElementResizer`

更新配置选项，支持链式调用。

```typescript
resizer
  .setOptions({ expandClassName: 'new-expanded' })
  .setOptions({ duration: 500 });
```

##### `getPlaceholder(): HTMLElement | null`

获取占位符元素。

```typescript
const placeholder = resizer.getPlaceholder();
if (placeholder) {
  placeholder.style.backgroundColor = 'red';
}
```

##### `getRelativeRect(target: HTMLElement): ElementResizerRect`

获取目标元素的相对位置和尺寸。

```typescript
const rect = resizer.getRelativeRect(targetElement);
console.log(rect); // { top, left, width, height, right, bottom }
```

##### `toUnit(value: string | number): string`

将数值转换为带单位的字符串。

```typescript
console.log(resizer.toUnit(100)); // "100px"
console.log(resizer.toUnit('50%')); // "50%"
```

##### `destroy(): void`

销毁实例并清理资源。

```typescript
resizer.destroy();
```

### 类型定义

#### ElementResizerRect

```typescript
interface ElementResizerRect {
  top: string | number;
  right: string | number;
  bottom: string | number;
  left: string | number;
  width: string | number;
  height: string | number;
}
```

#### AnimationState

```typescript
enum AnimationState {
  IDLE = 'idle',
  EXPANDING = 'expanding',
  EXPANDED = 'expanded',
  COLLAPSING = 'collapsing',
  COLLAPSED = 'collapsed'
}
```

## ElementZoom：iOS 风格展开卡片

`ElementZoom` 让一张卡片从列表行（或任意元素）里「长」出来铺满屏幕，关闭时再缩回原位置，效果类似 iOS App Store 的卡片展开。

与 `ElementResizer` 的区别：`ElementResizer` 在原位置把元素本身撑大；`ElementZoom` 是一层独立的 `fixed` 卡片，从起点元素的位置开始变形。

实现要点：

- 卡片一开始就按最终尺寸布局，动画只改 `transform` 和 `clip-path`，不触发重新布局，内容也不会被挤压
- 基于 Web Animations API，展开到一半时关闭会从当前状态直接缩回（可打断）
- 关闭时会重新测量起点元素的位置，列表滚动过也能缩回正确位置；起点不在屏幕内时改为缩放加淡出
- 可选：起点元素的副本交叉淡入淡出、下拉关闭手势
- 不支持 `element.animate` 的环境会直接跳到最终状态

### 原生用法

```ts
import {
  ElementZoom,
  viewportInsetRect,
  lockBodyScroll,
  bindHistoryBack
} from '@brain-toolkit/element-sizer';

const zoom = new ElementZoom({
  target: cardEl, // 卡片，会被设为 fixed
  origin: () => rowEl, // 起点元素，关闭时重新读取
  to: viewportInsetRect({ top: 28, gap: 10, radius: 22 }),
  backdrop: maskEl, // 可选：遮罩
  ghost: ghostEl, // 可选：卡片内左上角的容器，用于显示起点元素的副本
  content: () => [scrollEl, closeBtn] // 可选：展开后淡入的内容
});

const unlock = lockBodyScroll();
const history = bindHistoryBack(() => {
  unlock();
  zoom.close().then(() => cardEl.remove());
});
zoom.enableDragDismiss({ scrollEl, onDismiss: history.back });

await zoom.open();
// 关闭按钮：history.back()，让返回键和按钮走同一条路径
```

### 配置选项（ElementZoomOptions）

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `target` | 必填 | 卡片元素 |
| `origin` | — | 返回起点元素的函数；返回 null 时用缩放淡入淡出 |
| `to` | `viewportInsetRect()` | 返回展开后矩形的函数，每次打开时计算 |
| `originRadius` | `12` | 起点形状的圆角（px） |
| `duration` | `460` | 动画时长（ms） |
| `easing` | `cubic-bezier(.32,.72,0,1)` | 缓动曲线 |
| `backdrop` | — | 遮罩元素 |
| `ghost` | — | 显示起点元素副本的容器 |
| `content` | — | 返回需要淡入淡出的内容元素 |
| `hideOrigin` | `true` | 卡片打开期间隐藏起点元素 |

方法：`open()` / `close()`（返回 Promise，重复调用 `close()` 共用同一个动画）、`enableDragDismiss({ scrollEl, distance?, onDismiss })`（返回移除监听的函数）、`destroy()`。状态通过 `state` 读取（`AnimationState`）。

辅助函数：`viewportInsetRect({ top, gap, radius })`、`lockBodyScroll()`、`bindHistoryBack(onBack, { stateKey })`。

### React 用法

`@brain-toolkit/element-sizer/react` 提供 `useElementZoom`，挂载时打开，默认会锁定滚动、接入返回键、开启下拉关闭。`react` 是可选的 peer 依赖，不用这个入口就不需要安装。

```tsx
import { createPortal } from 'react-dom';
import { useElementZoom } from '@brain-toolkit/element-sizer/react';

function ZoomCard({ getRow, onClosed }) {
  // 需要解构：React Compiler 的 lint 不允许在渲染时访问包含 ref 的对象的属性
  const { targetRef, backdropRef, ghostRef, scrollRef, contentRef, close } =
    useElementZoom({ origin: getRow, onClosed });

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div ref={backdropRef} onClick={close} className="absolute inset-0 bg-black/50 opacity-0" />
      <div ref={targetRef} role="dialog" aria-modal="true" className="overflow-hidden bg-white">
        <div ref={ghostRef} aria-hidden className="pointer-events-none absolute top-0 left-0" />
        <div ref={scrollRef} className="h-full overflow-y-auto opacity-0">…</div>
        <button ref={contentRef} onClick={close} className="absolute top-3 right-3 opacity-0">✕</button>
      </div>
    </div>,
    document.body
  );
}
```

`useElementZoom` 额外选项：`history`（默认 `true`，可传 `{ stateKey }`）、`lockScroll`（默认 `true`）、`dragToDismiss`（默认 `true`，可传 `{ distance }`）、`onClosed`（关闭动画结束后调用，在这里卸载卡片）。

## 使用场景

### 1. 手风琴组件

```typescript
class AccordionItem {
  private resizer: ElementResizer;
  private isExpanded = false;

  constructor(private element: HTMLElement) {
    const content = element.querySelector('.accordion-content') as HTMLElement;

    this.resizer = new ElementResizer({
      target: content,
      placeholder: true,
      expandClassName: 'accordion-expanded',
      collapseClassName: 'accordion-collapsed'
    });

    // 初始状态为折叠
    this.resizer.collapse();
  }

  toggle() {
    if (this.isExpanded) {
      this.resizer.collapse();
    } else {
      this.resizer.expand();
    }
    this.isExpanded = !this.isExpanded;
  }
}
```

### 2. 模态框动画

```typescript
class AnimatedModal {
  private resizer: ElementResizer;

  constructor(private modalElement: HTMLElement) {
    this.resizer = new ElementResizer({
      target: modalElement,
      expandClassName: 'modal-open',
      collapseClassName: 'modal-closed',
      duration: 300
    });
  }

  show() {
    this.modalElement.style.display = 'block';
    this.resizer.expand();
  }

  hide() {
    this.resizer.collapse();

    // 动画完成后隐藏元素
    setTimeout(() => {
      this.modalElement.style.display = 'none';
    }, 300);
  }
}
```

### 3. 侧边栏折叠

```typescript
class CollapsibleSidebar {
  private resizer: ElementResizer;
  private isCollapsed = false;

  constructor(private sidebar: HTMLElement) {
    this.resizer = new ElementResizer({
      target: sidebar,
      expandClassName: 'sidebar-expanded',
      collapseClassName: 'sidebar-collapsed',
      placeholder: false // 侧边栏通常不需要占位符
    });
  }

  toggle() {
    if (this.isCollapsed) {
      this.resizer.expand();
    } else {
      this.resizer.collapse();
    }
    this.isCollapsed = !this.isCollapsed;
  }
}
```

### 4. 卡片展开详情

```typescript
class ExpandableCard {
  private resizer: ElementResizer;
  private detailsElement: HTMLElement;

  constructor(private cardElement: HTMLElement) {
    this.detailsElement = cardElement.querySelector(
      '.card-details'
    ) as HTMLElement;

    this.resizer = new ElementResizer({
      target: this.detailsElement,
      placeholder: true,
      expandClassName: 'details-expanded',
      root: cardElement // 相对于卡片容器计算位置
    });

    // 绑定点击事件
    const toggleButton = cardElement.querySelector('.toggle-details');
    toggleButton?.addEventListener('click', () => this.toggleDetails());
  }

  toggleDetails() {
    if (
      this.resizer.animationState === 'collapsed' ||
      this.resizer.animationState === 'idle'
    ) {
      this.resizer.expand();
    } else if (this.resizer.animationState === 'expanded') {
      this.resizer.collapse();
    }
  }
}
```

## 高级用法

### 自定义位置计算

```typescript
const resizer = new ElementResizer({
  target: targetElement,
  getRelativeRect: (target, container) => {
    // 自定义位置计算逻辑
    const targetRect = target.getBoundingClientRect();
    const containerRect =
      container instanceof HTMLElement
        ? container.getBoundingClientRect()
        : { top: 0, left: 0 };

    return {
      top: targetRect.top - containerRect.top,
      left: targetRect.left - containerRect.left,
      width: targetRect.width,
      height: targetRect.height,
      right: targetRect.right - containerRect.left,
      bottom: targetRect.bottom - containerRect.top
    };
  }
});
```

### 动画状态监听

```typescript
const resizer = new ElementResizer({ target: targetElement });

// 监听动画状态变化
const checkAnimationState = () => {
  switch (resizer.animationState) {
    case 'expanding':
      console.log('正在展开...');
      break;
    case 'expanded':
      console.log('展开完成');
      break;
    case 'collapsing':
      console.log('正在折叠...');
      break;
    case 'collapsed':
      console.log('折叠完成');
      break;
  }
};

// 定期检查状态（实际使用中可能需要更优雅的方式）
const interval = setInterval(checkAnimationState, 100);
```

### 链式操作

```typescript
const resizer = new ElementResizer()
  .setOptions({ target: targetElement })
  .setOptions({ expandClassName: 'expanded' })
  .setOptions({ collapseClassName: 'collapsed' })
  .setOptions({ duration: 400 });

// 延迟操作
setTimeout(() => resizer.expand(), 1000);
setTimeout(() => resizer.collapse(), 3000);
```

## 注意事项

### CSS 要求

目标元素必须设置 CSS transition 属性：

```css
.target-element {
  /* 必需：指定需要动画的属性 */
  transition:
    width 300ms ease,
    height 300ms ease,
    top 300ms ease,
    left 300ms ease;

  /* 或者使用 all */
  transition: all 300ms ease;
}
```

### 性能优化

1. **避免频繁切换**：在动画进行中避免调用新的动画
2. **及时清理**：组件销毁时调用 `destroy()` 方法
3. **合理使用占位符**：根据布局需求选择是否使用占位符

```typescript
// 检查动画状态
if (!resizer.isAnimating) {
  resizer.expand();
}

// 组件销毁时清理
onDestroy(() => {
  resizer.destroy();
});
```

### 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 故障排除

### 常见问题

1. **动画不生效**
   - 检查目标元素是否设置了 CSS transition
   - 确认元素有明确的尺寸

2. **位置计算错误**
   - 检查容器元素的定位方式
   - 考虑使用自定义 `getRelativeRect` 函数

3. **占位符问题**
   - 确保目标元素有父节点（自动创建占位符时）
   - 检查占位符元素的样式设置

### 调试技巧

```typescript
// 启用调试信息
const resizer = new ElementResizer({
  target: targetElement,
  placeholder: true
});

// 检查当前状态
console.log('Animation State:', resizer.animationState);
console.log('Is Animating:', resizer.isAnimating);
console.log('Target Rect:', resizer.getRelativeRect(targetElement));
console.log('Placeholder:', resizer.getPlaceholder());
```

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新详情。
