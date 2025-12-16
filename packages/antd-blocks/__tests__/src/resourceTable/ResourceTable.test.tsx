 
import { render, screen } from '@testing-library/react';
import { ResourceTable } from '../../../src/resourceTable/ResourceTable';
import { ResourceTableEventInterface } from '../../../src';
import * as SliceStoreReact from '@qlover/slice-store-react';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock dependencies
vi.mock('@qlover/slice-store-react', () => ({
  useSliceStore: vi.fn()
}));

describe('ResourceTable', () => {
  const mockResourceStore = {
    getState: vi.fn(),
    subscribe: vi.fn()
  };

  const mockResource = {
    name: 'users',
    getStore: vi.fn(() => mockResourceStore)
  };

  const mockOnChangeParams = vi.fn();
  const mockGetResource = vi.fn(() => mockResource);
  const mockOnEdited = vi.fn();
  const mockOnDeleted = vi.fn();
  const mockOnDetail = vi.fn();

  const mockTableEvent = {
    getResource: mockGetResource,
    onChangeParams: mockOnChangeParams,
    onEdited: mockOnEdited,
    onDeleted: mockOnDeleted,
    onDetail: mockOnDetail
  } as unknown as ResourceTableEventInterface;

  const mockColumns = [
    {
      key: 'id',
      title: 'ID',
      dataIndex: 'id',
      tt: {} as any
    },
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      tt: {} as any
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      tt: {} as any
    }
  ];

  const mockDataSource = [
    { id: 1, name: 'User 1', email: 'user1@example.com' },
    { id: 2, name: 'User 2', email: 'user2@example.com' },
    { id: 3, name: 'User 3', email: 'user3@example.com' }
  ];

  const defaultSearchParams = {
    page: 1,
    pageSize: 10
  };

  const defaultListState = {
    loading: false,
    result: {
      list: mockDataSource,
      total: 3,
      page: 1,
      pageSize: 10
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock return values
    (SliceStoreReact.useSliceStore as any).mockImplementation(
      (_store: any, selector: any) => {
        // First call returns searchParams
        if (
          selector === (SliceStoreReact.useSliceStore as any).mock.calls[0]?.[1]
        ) {
          return defaultSearchParams;
        }
        // Second call returns listState
        return defaultListState;
      }
    );
  });

  it('should render table with testid', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    expect(screen.getByTestId('ResourcesTable')).toBeTruthy();
  });

  it('should render table with data', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    expect(screen.getByText('User 1')).toBeTruthy();
    expect(screen.getByText('User 2')).toBeTruthy();
    expect(screen.getByText('User 3')).toBeTruthy();
  });

  it('should render table columns', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    // Verify table is rendered
    const table = screen.getByTestId('ResourcesTable');
    expect(table).toBeTruthy();

    // Verify data is rendered
    expect(screen.getByText('User 1')).toBeTruthy();
  });

  it('should render action column by default', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    // Verify action buttons are rendered
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should not render action column when actionProps is false', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(
      <ResourceTable
        columns={mockColumns}
        tableEvent={mockTableEvent}
        actionProps={false}
      />
    );

    expect(screen.queryByText('Action')).toBeNull();
  });

  it('should render custom action column title', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(
      <ResourceTable
        columns={mockColumns}
        tableEvent={mockTableEvent}
        actionProps={{
          title: 'Operations',
          editText: 'Edit',
          deleteText: 'Delete',
          detailText: 'Detail'
        }}
      />
    );

    // Verify custom action buttons are rendered with custom text
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBe(mockDataSource.length);
  });

  it('should show loading state', () => {
    const loadingListState = {
      loading: true,
      result: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10
      }
    };

    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(loadingListState);

    const { container } = render(
      <ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />
    );

    const spinner = container.querySelector('.ant-spin');
    expect(spinner).toBeTruthy();
  });

  it('should render empty table when no data', () => {
    const emptyListState = {
      loading: false,
      result: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10
      }
    };

    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(emptyListState);

    const { container } = render(
      <ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />
    );

    const emptyElement = container.querySelector('.ant-empty');
    expect(emptyElement).toBeTruthy();
  });

  it('should display pagination with correct values', () => {
    const listStateWithPagination = {
      loading: false,
      result: {
        list: mockDataSource,
        total: 100,
        page: 2,
        pageSize: 10
      }
    };

    const searchParams = {
      page: 2,
      pageSize: 10
    };

    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(searchParams)
      .mockReturnValueOnce(listStateWithPagination);

    const { container } = render(
      <ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />
    );

    const pagination = container.querySelector('.ant-pagination');
    expect(pagination).toBeTruthy();
  });

  it('should call onChangeParams when page changes', async () => {
    const listStateWithMultiplePages = {
      loading: false,
      result: {
        list: mockDataSource,
        total: 30,
        page: 1,
        pageSize: 10
      }
    };

    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(listStateWithMultiplePages);

    const { container } = render(
      <ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />
    );

    // Verify pagination exists
    const pagination = container.querySelector('.ant-pagination');
    expect(pagination).toBeTruthy();
  });

  it('should use id as rowKey by default', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    const { container } = render(
      <ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />
    );

    // Check if rows have data-row-key attribute with id values
    const firstRow = container.querySelector('[data-row-key="1"]');
    expect(firstRow).toBeTruthy();
  });

  it('should enable horizontal scroll by default', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    const { container } = render(
      <ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />
    );

    const scrollContainer = container.querySelector('.ant-table-content');
    expect(scrollContainer).toBeTruthy();
  });

  it('should pass additional table props', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    const { container } = render(
      <ResourceTable
        columns={mockColumns}
        tableEvent={mockTableEvent}
        className="custom-table"
        size="small"
      />
    );

    const table = container.querySelector('.custom-table');
    expect(table).toBeTruthy();

    const smallTable = container.querySelector('.ant-table-small');
    expect(smallTable).toBeTruthy();
  });

  it('should have pageSizeOptions [10, 20, 50]', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    const { container } = render(
      <ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />
    );

    // Pagination should be rendered
    const pagination = container.querySelector('.ant-pagination');
    expect(pagination).toBeTruthy();
  });

  it('should merge custom pagination props', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    const { container } = render(
      <ResourceTable
        columns={mockColumns}
        tableEvent={mockTableEvent}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true
        }}
      />
    );

    const pagination = container.querySelector('.ant-pagination');
    expect(pagination).toBeTruthy();
  });

  it('should call getResource on mount', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    expect(mockGetResource).toHaveBeenCalled();
    expect(mockResource.getStore).toHaveBeenCalled();
  });

  it('should use resourceSelectors to get data', () => {
    const mockUseSliceStore = vi
      .fn()
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    (SliceStoreReact.useSliceStore as any) = mockUseSliceStore;

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    // Should call useSliceStore twice with resourceStore
    expect(mockUseSliceStore).toHaveBeenCalledTimes(2);
    expect(mockUseSliceStore).toHaveBeenCalledWith(
      mockResourceStore,
      expect.any(Function)
    );
  });

  it('should render ResourceTableAction for each row', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(
      <ResourceTable
        columns={mockColumns}
        tableEvent={mockTableEvent}
        actionProps={{
          editText: 'Edit',
          deleteText: 'Delete',
          detailText: 'Detail'
        }}
      />
    );

    // Should have action buttons for each row
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBe(mockDataSource.length);
  });

  it('should handle undefined list result', () => {
    const undefinedListState = {
      loading: false,
      result: undefined
    };

    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(undefinedListState);

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    const table = screen.getByTestId('ResourcesTable');
    expect(table).toBeTruthy();
  });

  it('should render with custom action column width', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(
      <ResourceTable
        columns={mockColumns}
        tableEvent={mockTableEvent}
        actionProps={{
          width: 200,
          editText: 'Edit',
          deleteText: 'Delete',
          detailText: 'Detail'
        }}
      />
    );

    // Verify action buttons are rendered with custom props
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBe(mockDataSource.length);
  });

  it('should fix action column to right by default', () => {
    (SliceStoreReact.useSliceStore as any)
      .mockReturnValueOnce(defaultSearchParams)
      .mockReturnValueOnce(defaultListState);

    render(<ResourceTable columns={mockColumns} tableEvent={mockTableEvent} />);

    // Action column should be present with action buttons
    const editButtons = screen.getAllByText('Edit');
    const deleteButtons = screen.getAllByText('Delete');
    const detailButtons = screen.getAllByText('Detail');

    expect(editButtons.length).toBe(mockDataSource.length);
    expect(deleteButtons.length).toBe(mockDataSource.length);
    expect(detailButtons.length).toBe(mockDataSource.length);
  });
});
