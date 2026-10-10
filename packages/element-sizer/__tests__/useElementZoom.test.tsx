import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useElementZoom, type UseElementZoomOptions } from '../src/react';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

function Card(props: UseElementZoomOptions & { onApi: (close: () => void) => void }) {
  const { onApi, ...options } = props;
  const { targetRef, backdropRef, ghostRef, scrollRef, contentRef, close } =
    useElementZoom(options);
  onApi(close);
  return (
    <div>
      <div ref={backdropRef} data-testid="backdrop" />
      <div ref={targetRef} data-testid="target">
        <div ref={ghostRef} />
        <div ref={scrollRef} data-testid="scroll" />
        <button ref={contentRef} type="button" />
      </div>
    </div>
  );
}

describe('useElementZoom', () => {
  let host: HTMLDivElement;
  let root: Root;
  let origin: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    origin = document.createElement('div');
    document.body.append(origin, host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    window.history.replaceState(null, '');
  });

  it('opens on mount, locks scroll and closes through history', async () => {
    const onClosed = vi.fn();
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    let close = () => {};

    await act(async () => {
      root.render(
        <Card
          origin={() => origin}
          onClosed={onClosed}
          onApi={(fn) => (close = fn)}
        />
      );
    });

    const target = host.querySelector('[data-testid="target"]') as HTMLElement;
    expect(target.style.position).toBe('fixed');
    expect(origin.style.visibility).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
    expect(
      (window.history.state as { elementZoom?: boolean } | null)?.elementZoom
    ).toBe(true);

    await act(async () => {
      close();
    });

    expect(back).toHaveBeenCalled();
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(origin.style.visibility).toBe('');
    expect(document.body.style.overflow).toBe('');
    back.mockRestore();
  });

  it('closes directly when history is disabled', async () => {
    const onClosed = vi.fn();
    const push = vi.spyOn(window.history, 'pushState');
    let close = () => {};

    await act(async () => {
      root.render(
        <Card
          history={false}
          lockScroll={false}
          onClosed={onClosed}
          onApi={(fn) => (close = fn)}
        />
      );
    });
    expect(push).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('');

    await act(async () => {
      close();
    });
    expect(onClosed).toHaveBeenCalledTimes(1);
    push.mockRestore();
  });
});
