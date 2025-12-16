 
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceTablePopup } from '../../../src/resourceTable/ResourceTablePopup';
import { ResourceTableEventInterface } from '../../../src';
import { ResourceTableContext } from '../../../src/resourceTable/ResourceTableContext';
import * as SliceStoreReact from '@qlover/slice-store-react';
import { Grid } from 'antd';

// Mock dependencies
vi.mock('@qlover/slice-store-react', () => ({
  useSliceStore: vi.fn()
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Grid: {
      useBreakpoint: vi.fn()
    }
  };
});

describe('ResourceTablePopup', () => {
  const mockOnClosePopup = vi.fn();
  const mockStore = {
    getState: vi.fn(),
    subscribe: vi.fn()
  };

  const mockTableEvent = {
    store: mockStore,
    onClosePopup: mockOnClosePopup
  } as unknown as ResourceTableEventInterface;

  const defaultTt = {
    create: 'Create Resource',
    edit: 'Edit Resource',
    detail: 'Resource Detail'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (SliceStoreReact.useSliceStore as any).mockImplementation(
      (store: any, selector: any) => {
        // First call returns openPopup state
        if (
          selector.name === 'openPopup' ||
          !mockOnClosePopup.mock.calls.length
        ) {
          return true;
        }
        // Second call returns action state
        return 'create';
      }
    );

    (Grid.useBreakpoint as any).mockReturnValue({
      sm: true,
      md: true,
      lg: true
    });
  });

  it('should render drawer with children', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true) // openPopup
      .mockReturnValueOnce('create'); // action

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div data-testid="popup-content">Test Content</div>
      </ResourceTablePopup>
    );

    expect(screen.getByTestId('AdminTablePopup')).toBeTruthy();
    expect(screen.getByTestId('popup-content')).toBeTruthy();
    expect(screen.getByTestId('popup-content').textContent).toBe(
      'Test Content'
    );
  });

  it('should display correct title based on action', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true) // openPopup
      .mockReturnValueOnce('create'); // action

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div>Content</div>
      </ResourceTablePopup>
    );

    expect(screen.getByText('Create Resource')).toBeTruthy();
  });

  it('should display edit title when action is edit', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true) // openPopup
      .mockReturnValueOnce('edit'); // action

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div>Content</div>
      </ResourceTablePopup>
    );

    expect(screen.getByText('Edit Resource')).toBeTruthy();
  });

  it('should display detail title when action is detail', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true) // openPopup
      .mockReturnValueOnce('detail'); // action

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div>Content</div>
      </ResourceTablePopup>
    );

    expect(screen.getByText('Resource Detail')).toBeTruthy();
  });

  it('should control drawer open state from store', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(false) // openPopup = false
      .mockReturnValueOnce('create'); // action

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div data-testid="content">Content</div>
      </ResourceTablePopup>
    );

    // When drawer is closed, content should not be visible in the document
    const content = screen.queryByTestId('content');
    expect(content).toBeNull();
  });

  it('should call onClosePopup when drawer is closed', async () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true) // openPopup
      .mockReturnValueOnce('create'); // action

    const user = userEvent.setup();
    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div>Content</div>
      </ResourceTablePopup>
    );

    // Find and click the close button
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClosePopup).toHaveBeenCalledTimes(1);
  });

  it('should use right placement by default on large screens', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    (Grid.useBreakpoint as any).mockReturnValue({ sm: true });

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div data-testid="content">Content</div>
      </ResourceTablePopup>
    );

    // Verify content is rendered when drawer is open
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('should use bottom placement on small screens by default', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    (Grid.useBreakpoint as any).mockReturnValue({ sm: false });

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div data-testid="content">Content</div>
      </ResourceTablePopup>
    );

    // Verify drawer renders with content on small screens
    const drawer = screen.getByTestId('AdminTablePopup');
    expect(drawer).toBeTruthy();
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('should use custom smPlacement on small screens', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    (Grid.useBreakpoint as any).mockReturnValue({ sm: false });

    render(
      <ResourceTablePopup
        tableEvent={mockTableEvent}
        tt={defaultTt}
        smPlacement="top"
      >
        <div data-testid="content">Content</div>
      </ResourceTablePopup>
    );

    // Verify drawer renders with content using custom smPlacement
    const drawer = screen.getByTestId('AdminTablePopup');
    expect(drawer).toBeTruthy();
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('should use context smPlacement when prop is not provided', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    (Grid.useBreakpoint as any).mockReturnValue({ sm: false });

    const contextValue = { smPlacement: 'left' as const };

    render(
      <ResourceTableContext.Provider value={contextValue}>
        <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
          <div data-testid="content">Content</div>
        </ResourceTablePopup>
      </ResourceTableContext.Provider>
    );

    // Verify drawer renders with content using context smPlacement
    const drawer = screen.getByTestId('AdminTablePopup');
    expect(drawer).toBeTruthy();
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('should pass additional drawer props', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    render(
      <ResourceTablePopup
        tableEvent={mockTableEvent}
        tt={defaultTt}
        width={600}
        className="custom-drawer"
        data-custom-attr="test-value"
      >
        <div data-testid="content">Content</div>
      </ResourceTablePopup>
    );

    // Verify content is accessible
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('should work without tt prop', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    render(
      <ResourceTablePopup tableEvent={mockTableEvent}>
        <div data-testid="content">Content</div>
      </ResourceTablePopup>
    );

    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('should render with custom placement prop', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    (Grid.useBreakpoint as any).mockReturnValue({ sm: true });

    render(
      <ResourceTablePopup
        tableEvent={mockTableEvent}
        tt={defaultTt}
        placement="left"
      >
        <div data-testid="content">Content</div>
      </ResourceTablePopup>
    );

    // Verify content is rendered
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('should use eventSelectos to get store values', () => {
    const mockUseSliceStore = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('edit');

    (SliceStoreReact.useSliceStore as any) = mockUseSliceStore;

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div>Content</div>
      </ResourceTablePopup>
    );

    // Should call useSliceStore twice
    expect(mockUseSliceStore).toHaveBeenCalledTimes(2);
    expect(mockUseSliceStore).toHaveBeenNthCalledWith(
      1,
      mockStore,
      expect.any(Function)
    );
    expect(mockUseSliceStore).toHaveBeenNthCalledWith(
      2,
      mockStore,
      expect.any(Function)
    );
  });

  it('should render multiple children', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce('create');

    render(
      <ResourceTablePopup tableEvent={mockTableEvent} tt={defaultTt}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </ResourceTablePopup>
    );

    expect(screen.getByTestId('child-1')).toBeTruthy();
    expect(screen.getByTestId('child-2')).toBeTruthy();
    expect(screen.getByTestId('child-3')).toBeTruthy();
  });
});
