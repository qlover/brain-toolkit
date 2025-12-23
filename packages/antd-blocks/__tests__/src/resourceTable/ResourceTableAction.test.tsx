import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceTableAction } from '../../../src/resourceTable/ResourceTableAction';
import type { ResourceTableEventInterface } from '../../../src';

describe('ResourceTableAction', () => {
  const mockOnEdited = vi.fn();
  const mockOnDeleted = vi.fn();
  const mockOnDetail = vi.fn();

  const mockTableEvent = {
    onEdited: mockOnEdited,
    onDeleted: mockOnDeleted,
    onDetail: mockOnDetail
  } as unknown as ResourceTableEventInterface;

  const mockRecord = {
    id: 1,
    name: 'Test'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component with default buttons', () => {
    render(
      <ResourceTableAction record={mockRecord} tableEvent={mockTableEvent} />
    );

    const container = screen.getByTestId('ResourceTableAction');
    expect(container).toBeTruthy();
    expect(container.className).toContain('flex');
    expect(container.className).toContain('gap-2');
  });

  it('should render three action buttons with default text', () => {
    render(
      <ResourceTableAction record={mockRecord} tableEvent={mockTableEvent} />
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Detail' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('should render buttons with custom text from settings', () => {
    const settings = {
      editText: '编辑',
      deleteText: '删除',
      detailText: '详情'
    };

    render(
      <ResourceTableAction
        record={mockRecord}
        tableEvent={mockTableEvent}
        settings={settings}
      />
    );

    expect(screen.getByRole('button', { name: '编辑' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '详情' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '删除' })).toBeTruthy();
  });

  it('should call onEdited when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResourceTableAction record={mockRecord} tableEvent={mockTableEvent} />
    );

    const editButton = screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);

    expect(mockOnEdited).toHaveBeenCalledTimes(1);
    // Verify first argument only (second argument is the click event)
    const [firstArg] = mockOnEdited.mock.calls[0];
    expect(firstArg).toEqual({
      dataSource: mockRecord
    });
  });

  it('should call onDetail when detail button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResourceTableAction record={mockRecord} tableEvent={mockTableEvent} />
    );

    const detailButton = screen.getByRole('button', { name: 'Detail' });
    await user.click(detailButton);

    expect(mockOnDetail).toHaveBeenCalledTimes(1);
    // Verify first argument only (second argument is the click event)
    const [firstArg] = mockOnDetail.mock.calls[0];
    expect(firstArg).toEqual({
      dataSource: mockRecord
    });
  });

  it('should call onDeleted when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ResourceTableAction record={mockRecord} tableEvent={mockTableEvent} />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    expect(mockOnDeleted).toHaveBeenCalledTimes(1);
    // Verify first argument only (second argument is the click event)
    const [firstArg] = mockOnDeleted.mock.calls[0];
    expect(firstArg).toEqual({
      dataSource: mockRecord
    });
  });

  it('should pass additional HTML attributes to container', () => {
    render(
      <ResourceTableAction
        record={mockRecord}
        tableEvent={mockTableEvent}
        data-custom="test-attribute"
        id="custom-id"
      />
    );

    const container = screen.getByTestId('ResourceTableAction');
    expect(container.getAttribute('data-custom')).toBe('test-attribute');
    expect(container.getAttribute('id')).toBe('custom-id');
  });

  it('should render delete button with danger style', () => {
    render(
      <ResourceTableAction record={mockRecord} tableEvent={mockTableEvent} />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton.className).toContain('ant-btn-dangerous');
  });

  it('should work with different record types', async () => {
    const user = userEvent.setup();
    const customRecord = {
      userId: 'user-123',
      email: 'test@example.com',
      active: true
    };

    render(
      <ResourceTableAction record={customRecord} tableEvent={mockTableEvent} />
    );

    const editButton = screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);

    // Verify first argument only (second argument is the click event)
    const [firstArg] = mockOnEdited.mock.calls[0];
    expect(firstArg).toEqual({
      dataSource: customRecord
    });
  });
});
