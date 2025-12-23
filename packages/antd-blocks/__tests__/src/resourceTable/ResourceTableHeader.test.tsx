import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceTableHeader } from '../../../src/resourceTable/ResourceTableHeader';
import type { ResourceTableEventInterface } from '../../../src';

describe('ResourceTableHeader', () => {
  const mockResource = {
    name: 'users',
    endpoint: '/api/users'
  };

  const mockGetResource = vi.fn(() => mockResource);
  const mockOnCreated = vi.fn();
  const mockOnRefresh = vi.fn();

  const mockTableEvent = {
    getResource: mockGetResource,
    onCreated: mockOnCreated,
    onRefresh: mockOnRefresh
  } as unknown as ResourceTableEventInterface;

  const defaultSettings = {
    create: 'Create',
    refresh: 'Refresh',
    search: 'Search',
    reset: 'Reset',
    export: 'Export',
    settings: 'Settings'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component with default layout', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    const container = screen.getByTestId('ResourcesTableHeader');
    expect(container).toBeTruthy();
    expect(container.className).toContain('flex');
    expect(container.className).toContain('items-center');
    expect(container.className).toContain('justify-between');
  });

  it('should render left and right action containers', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    expect(screen.getByTestId('ResourcesTableHeaderLeftActions')).toBeTruthy();
    expect(screen.getByTestId('ResourcesTableHeaderRightActions')).toBeTruthy();
  });

  it('should call getResource on mount', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    expect(mockGetResource).toHaveBeenCalled();
  });

  it('should render create button with text and icon', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    const createButton = screen.getByTestId('ResourcesTableCreateButton');
    expect(createButton).toBeTruthy();
    expect(createButton.textContent).toBe('Create');
    expect(createButton.getAttribute('title')).toBe('Create');
    expect(createButton.querySelector('.anticon-plus')).toBeTruthy();
  });

  it('should render create button with custom text', () => {
    const customSettings = {
      ...defaultSettings,
      create: '新建'
    };

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={customSettings}
      />
    );

    const createButton = screen.getByTestId('ResourcesTableCreateButton');
    expect(createButton.textContent).toBe('新建');
    expect(createButton.getAttribute('title')).toBe('新建');
  });

  it('should hide create button when settings.create is false', () => {
    const customSettings = {
      ...defaultSettings,
      create: false as const
    };

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={customSettings}
      />
    );

    expect(screen.queryByTestId('ResourcesTableCreateButton')).toBeNull();
  });

  it('should call onCreated when create button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    const createButton = screen.getByTestId('ResourcesTableCreateButton');
    await user.click(createButton);

    expect(mockOnCreated).toHaveBeenCalledTimes(1);
    const [firstArg] = mockOnCreated.mock.calls[0];
    expect(firstArg).toEqual({
      resource: mockResource
    });
  });

  it('should render refresh button with icon', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    const refreshButton = screen.getByTestId('ResourcesTableRefreshButton');
    expect(refreshButton).toBeTruthy();
    expect(refreshButton.getAttribute('title')).toBe('Refresh');
    expect(refreshButton.querySelector('.anticon-redo')).toBeTruthy();
  });

  it('should render refresh button with custom title', () => {
    const customSettings = {
      ...defaultSettings,
      refresh: '刷新'
    };

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={customSettings}
      />
    );

    const refreshButton = screen.getByTestId('ResourcesTableRefreshButton');
    expect(refreshButton.getAttribute('title')).toBe('刷新');
  });

  it('should hide refresh button when settings.refresh is false', () => {
    const customSettings = {
      ...defaultSettings,
      refresh: false as const
    };

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={customSettings}
      />
    );

    expect(screen.queryByTestId('ResourcesTableRefreshButton')).toBeNull();
  });

  it('should call onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    const refreshButton = screen.getByTestId('ResourcesTableRefreshButton');
    await user.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    const [firstArg] = mockOnRefresh.mock.calls[0];
    expect(firstArg).toEqual({
      resource: mockResource
    });
  });

  it('should render custom actionLeft content', () => {
    const actionLeft = <div data-testid="custom-left">Custom Left</div>;

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
        actionLeft={actionLeft}
      />
    );

    expect(screen.getByTestId('custom-left')).toBeTruthy();
    expect(screen.getByTestId('custom-left').textContent).toBe('Custom Left');
  });

  it('should render custom actionRight content', () => {
    const actionRight = <div data-testid="custom-right">Custom Right</div>;

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
        actionRight={actionRight}
      />
    );

    expect(screen.getByTestId('custom-right')).toBeTruthy();
    expect(screen.getByTestId('custom-right').textContent).toBe('Custom Right');
  });

  it('should render both actionLeft and actionRight together', () => {
    const actionLeft = <div data-testid="custom-left">Left</div>;
    const actionRight = <div data-testid="custom-right">Right</div>;

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
        actionLeft={actionLeft}
        actionRight={actionRight}
      />
    );

    expect(screen.getByTestId('custom-left')).toBeTruthy();
    expect(screen.getByTestId('custom-right')).toBeTruthy();
  });

  it('should pass additional HTML attributes to container', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
        data-custom="test-attribute"
        id="custom-id"
      />
    );

    const container = screen.getByTestId('ResourcesTableHeader');
    expect(container.getAttribute('data-custom')).toBe('test-attribute');
    expect(container.getAttribute('id')).toBe('custom-id');
  });

  it('should hide both buttons when both settings are false', () => {
    const customSettings = {
      ...defaultSettings,
      create: false as const,
      refresh: false as const
    };

    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={customSettings}
      />
    );

    expect(screen.queryByTestId('ResourcesTableCreateButton')).toBeNull();
    expect(screen.queryByTestId('ResourcesTableRefreshButton')).toBeNull();
  });

  it('should render create button with primary type', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    const createButton = screen.getByTestId('ResourcesTableCreateButton');
    expect(createButton.className).toContain('ant-btn-primary');
  });

  it('should apply correct styles to refresh button', () => {
    render(
      <ResourceTableHeader
        tableEvent={mockTableEvent}
        settings={defaultSettings}
      />
    );

    const refreshButton = screen.getByTestId('ResourcesTableRefreshButton');
    expect(refreshButton.className).toContain('cursor-pointer');
    expect(refreshButton.className).toContain('transition-colors');
  });
});
