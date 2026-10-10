# @brain-toolkit/element-sizer

A powerful DOM element expand/collapse animation tool that provides smooth element size transition effects.

## Features

- 🎬 Smooth expand/collapse animation effects
- 🎯 Precise element positioning and size control
- 🔧 Full TypeScript support
- 🎨 CSS class name state management
- 📦 Lightweight with no external dependencies
- 🌐 Modern browser support
- 🔄 Automatic placeholder management
- ⚡ High-performance animation implementation
- 🃏 `ElementZoom`: iOS-style expanding card, with a React hook

## Installation

```bash
npm install @brain-toolkit/element-sizer
```

```bash
yarn add @brain-toolkit/element-sizer
```

```bash
pnpm add @brain-toolkit/element-sizer
```

## Quick Start

### Basic Usage

```typescript
import { ElementResizer } from '@brain-toolkit/element-sizer';

// Get target element
const targetElement = document.getElementById('collapsible-content');

// Create ElementResizer instance
const resizer = new ElementResizer({
  target: targetElement,
  placeholder: true, // Auto-create placeholder
  expandClassName: 'expanded',
  collapseClassName: 'collapsed'
});

// Expand element
resizer.expand();

// Collapse element
resizer.collapse();
```

### HTML Structure Example

```html
<div class="container">
  <button onclick="toggleElement()">Toggle Display</button>

  <div id="collapsible-content" class="collapsible-item">
    <div class="content">
      <h3>Collapsible Content</h3>
      <p>This is the content that needs to be expanded/collapsed...</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
        <li>List item 3</li>
      </ul>
    </div>
  </div>
</div>
```

### CSS Style Configuration

```css
.collapsible-item {
  /* Required: Set transition animation */
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

## API Documentation

### ElementResizer Class

#### Constructor

```typescript
new ElementResizer(options?: ElementResizerOptions)
```

#### Configuration Options (ElementResizerOptions)

```typescript
interface ElementResizerOptions {
  /** Target element - element to be expanded/collapsed */
  target?: HTMLElement;

  /** Unit type, defaults to "px" */
  unit?: string;

  /** Placeholder configuration
   * - true: Auto-create placeholder
   * - false: Don't use placeholder
   * - HTMLElement: Use specified placeholder element
   */
  placeholder?: boolean | HTMLElement;

  /** CSS class name added when element is expanded */
  expandClassName?: string;

  /** CSS class name added when element is collapsed */
  collapseClassName?: string;

  /** Animation duration in milliseconds (overrides CSS transition duration) */
  duration?: number;

  /** Root container element for calculating relative position */
  root?: HTMLElement | Document | Window;

  /** Custom relative position calculation function */
  getRelativeRect?: (
    target: HTMLElement,
    container?: HTMLElement | Document | Window
  ) => ElementResizerRect;
}
```

#### Properties

##### `target: HTMLElement`

Get the target element.

```typescript
const targetElement = resizer.target;
```

##### `animationState: AnimationState`

Get the current animation state.

```typescript
import { AnimationState } from '@brain-toolkit/element-sizer';

console.log(resizer.animationState);
// Possible values: 'idle' | 'expanding' | 'expanded' | 'collapsing' | 'collapsed'
```

##### `isAnimating: boolean`

Check if animation is currently in progress.

```typescript
if (!resizer.isAnimating) {
  resizer.expand();
}
```

#### Methods

##### `expand(): void`

Expand the target element.

```typescript
resizer.expand();
```

##### `collapse(): void`

Collapse the target element.

```typescript
resizer.collapse();
```

##### `fixedCurrentTargetRect(): void`

Fix the current target element's position and size.

```typescript
resizer.fixedCurrentTargetRect();
```

##### `cancelAnimation(): void`

Cancel the current animation in progress.

```typescript
resizer.cancelAnimation();
```

##### `setOptions(options: Partial<ElementResizerOptions>): ElementResizer`

Update configuration options, supports method chaining.

```typescript
resizer
  .setOptions({ expandClassName: 'new-expanded' })
  .setOptions({ duration: 500 });
```

##### `getPlaceholder(): HTMLElement | null`

Get the placeholder element.

```typescript
const placeholder = resizer.getPlaceholder();
if (placeholder) {
  placeholder.style.backgroundColor = 'red';
}
```

##### `getRelativeRect(target: HTMLElement): ElementResizerRect`

Get the relative position and size of the target element.

```typescript
const rect = resizer.getRelativeRect(targetElement);
console.log(rect); // { top, left, width, height, right, bottom }
```

##### `toUnit(value: string | number): string`

Convert a numeric value to a string with units.

```typescript
console.log(resizer.toUnit(100)); // "100px"
console.log(resizer.toUnit('50%')); // "50%"
```

##### `destroy(): void`

Destroy the instance and clean up resources.

```typescript
resizer.destroy();
```

### Type Definitions

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

## ElementZoom: iOS-style expanding card

`ElementZoom` grows a card out of a list row (or any element) to fill the screen and shrinks it back on close, like the iOS App Store cards.

Compared with `ElementResizer`: `ElementResizer` enlarges the element itself in place; `ElementZoom` is a separate `fixed` card that morphs from the origin element's position.

How it works:

- The card is laid out once at its final size; only `transform` and `clip-path` animate, so there is no layout work per frame and content is never squeezed
- Built on the Web Animations API: closing halfway through opening shrinks back from the current frame (interruptible)
- The origin is re-measured on close, so it lands correctly after scrolling; when the origin is off screen the card scales and fades instead
- Optional: cross-fading copy of the origin, pull-down-to-dismiss
- Without `element.animate` it jumps straight to the final state

### Vanilla usage

```ts
import {
  ElementZoom,
  viewportInsetRect,
  lockBodyScroll,
  bindHistoryBack
} from '@brain-toolkit/element-sizer';

const zoom = new ElementZoom({
  target: cardEl, // the card; set to position: fixed
  origin: () => rowEl, // origin element, re-read on close
  to: viewportInsetRect({ top: 28, gap: 10, radius: 22 }),
  backdrop: maskEl, // optional mask
  ghost: ghostEl, // optional container at the card's top-left for the origin copy
  content: () => [scrollEl, closeBtn] // optional content faded in after opening
});

const unlock = lockBodyScroll();
const history = bindHistoryBack(() => {
  unlock();
  zoom.close().then(() => cardEl.remove());
});
zoom.enableDragDismiss({ scrollEl, onDismiss: history.back });

await zoom.open();
// Close button: history.back(), so the back gesture and the button share one path
```

### Options (ElementZoomOptions)

| Option | Default | Description |
| --- | --- | --- |
| `target` | required | Card element |
| `origin` | — | Returns the origin element; null falls back to scale + fade |
| `to` | `viewportInsetRect()` | Returns the expanded rect, evaluated on every open |
| `originRadius` | `12` | Corner radius of the origin shape (px) |
| `duration` | `460` | Duration (ms) |
| `easing` | `cubic-bezier(.32,.72,0,1)` | Easing |
| `backdrop` | — | Mask element |
| `ghost` | — | Container showing a copy of the origin |
| `content` | — | Returns content elements to fade |
| `hideOrigin` | `true` | Hide the origin while the card is open |

Methods: `open()` / `close()` (promises; repeated `close()` calls share one animation), `enableDragDismiss({ scrollEl, distance?, onDismiss })` (returns a function that removes the listeners), `destroy()`. Read the current `state` (`AnimationState`).

Helpers: `viewportInsetRect({ top, gap, radius })`, `lockBodyScroll()`, `bindHistoryBack(onBack, { stateKey })`.

### React

`@brain-toolkit/element-sizer/react` exports `useElementZoom`, which opens on mount and by default locks scroll, wires the back gesture and enables pull-to-dismiss. `react` is an optional peer dependency, only needed for this entry.

```tsx
import { createPortal } from 'react-dom';
import { useElementZoom } from '@brain-toolkit/element-sizer/react';

function ZoomCard({ getRow, onClosed }) {
  // Destructure: React Compiler lint flags property access on objects holding refs
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

Extra `useElementZoom` options: `history` (default `true`, or `{ stateKey }`), `lockScroll` (default `true`), `dragToDismiss` (default `true`, or `{ distance }`), `onClosed` (called after the close animation; unmount the card there).

## Use Cases

### 1. Accordion Component

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

    // Initial state is collapsed
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

### 2. Modal Animation

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

    // Hide element after animation completes
    setTimeout(() => {
      this.modalElement.style.display = 'none';
    }, 300);
  }
}
```

### 3. Collapsible Sidebar

```typescript
class CollapsibleSidebar {
  private resizer: ElementResizer;
  private isCollapsed = false;

  constructor(private sidebar: HTMLElement) {
    this.resizer = new ElementResizer({
      target: sidebar,
      expandClassName: 'sidebar-expanded',
      collapseClassName: 'sidebar-collapsed',
      placeholder: false // Sidebars usually don't need placeholders
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

### 4. Expandable Card Details

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
      root: cardElement // Calculate position relative to card container
    });

    // Bind click event
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

## Advanced Usage

### Custom Position Calculation

```typescript
const resizer = new ElementResizer({
  target: targetElement,
  getRelativeRect: (target, container) => {
    // Custom position calculation logic
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

### Animation State Monitoring

```typescript
const resizer = new ElementResizer({ target: targetElement });

// Monitor animation state changes
const checkAnimationState = () => {
  switch (resizer.animationState) {
    case 'expanding':
      console.log('Expanding...');
      break;
    case 'expanded':
      console.log('Expansion complete');
      break;
    case 'collapsing':
      console.log('Collapsing...');
      break;
    case 'collapsed':
      console.log('Collapse complete');
      break;
  }
};

// Check state periodically (in practice, you might need a more elegant approach)
const interval = setInterval(checkAnimationState, 100);
```

### Method Chaining

```typescript
const resizer = new ElementResizer()
  .setOptions({ target: targetElement })
  .setOptions({ expandClassName: 'expanded' })
  .setOptions({ collapseClassName: 'collapsed' })
  .setOptions({ duration: 400 });

// Delayed operations
setTimeout(() => resizer.expand(), 1000);
setTimeout(() => resizer.collapse(), 3000);
```

## Important Notes

### CSS Requirements

The target element must have CSS transition properties set:

```css
.target-element {
  /* Required: Specify properties to animate */
  transition:
    width 300ms ease,
    height 300ms ease,
    top 300ms ease,
    left 300ms ease;

  /* Or use all */
  transition: all 300ms ease;
}
```

### Performance Optimization

1. **Avoid frequent toggling**: Avoid calling new animations while one is in progress
2. **Clean up promptly**: Call `destroy()` method when component is destroyed
3. **Use placeholders wisely**: Choose whether to use placeholders based on layout needs

```typescript
// Check animation state
if (!resizer.isAnimating) {
  resizer.expand();
}

// Clean up on component destroy
onDestroy(() => {
  resizer.destroy();
});
```

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues

1. **Animation not working**
   - Check if target element has CSS transition set
   - Ensure element has explicit dimensions

2. **Position calculation errors**
   - Check container element positioning
   - Consider using custom `getRelativeRect` function

3. **Placeholder issues**
   - Ensure target element has a parent node (when auto-creating placeholder)
   - Check placeholder element styling

### Debugging Tips

```typescript
// Enable debug information
const resizer = new ElementResizer({
  target: targetElement,
  placeholder: true
});

// Check current state
console.log('Animation State:', resizer.animationState);
console.log('Is Animating:', resizer.isAnimating);
console.log('Target Rect:', resizer.getRelativeRect(targetElement));
console.log('Placeholder:', resizer.getPlaceholder());
```

## License

ISC

## Contributing

Issues and Pull Requests are welcome!

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version update details.
