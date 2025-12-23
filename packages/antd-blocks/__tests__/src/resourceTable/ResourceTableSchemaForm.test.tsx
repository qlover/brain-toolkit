import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from 'antd';
import { ResourceTableSchemaForm } from '../../../src/resourceTable/ResourceTableSchemaForm';
import type { ResourceTableEventInterface } from '../../../src';
import { ResourceTableContext } from '../../../src/resourceTable/ResourceTableContext';
import * as SliceStoreReact from '@qlover/slice-store-react';
import type { ResourceTableSchemaFormProps } from '../../../src/resourceTable/ResourceTableSchemaForm';

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

// Mock components
const MockInputComponent = (props: any) => (
  <input data-testid="mock-input" {...props} />
);

const MockTextareaComponent = (props: any) => (
  <textarea data-testid="mock-textarea" {...props} />
);

const MockSelectComponent = (props: any) => (
  <select data-testid="mock-select" {...props} />
);

// Test wrapper component that uses real Form.useForm()
function TestWrapper(
  props: Omit<ResourceTableSchemaFormProps<any>, 'formRef'>
) {
  const [form] = Form.useForm();
  return <ResourceTableSchemaForm {...props} formRef={form} />;
}

describe('ResourceTableSchemaForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClosePopup = vi.fn();
  const mockOnEdited = vi.fn();
  const mockStore = {
    getState: vi.fn(),
    subscribe: vi.fn(),
    state: {
      selectedResource: null
    }
  };

  const mockTableEvent = {
    store: mockStore,
    onSubmit: mockOnSubmit,
    onClosePopup: mockOnClosePopup,
    onEdited: mockOnEdited
  } as unknown as ResourceTableEventInterface;

  const mockTt = {
    title: 'Test Title',
    description: 'Test Description',
    content: 'Test Content',
    keywords: 'test',
    createTitle: 'Create',
    editTitle: 'Edit',
    detailTitle: 'Detail',
    deleteTitle: 'Delete',
    deleteContent: 'Are you sure?',
    saveButton: 'Save',
    detailButton: 'Detail',
    cancelButton: 'Cancel',
    createButton: 'Create',
    importTitle: 'Import',
    importZhTitle: 'Import ZH',
    importEnTitle: 'Import EN'
  };

  const defaultFormComponents = {
    input: MockInputComponent,
    textarea: MockTextareaComponent,
    select: MockSelectComponent
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (SliceStoreReact.useSliceStore as any).mockReturnValue('create');
  });

  it('should render form with testid', () => {
    render(
      <TestWrapper
        options={[]}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    expect(screen.getByTestId('AdminTableSchemaForm')).toBeTruthy();
  });

  it('should render form items based on options', () => {
    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {
          tableTitle: 'Name',
          description: 'User name',
          formItemLabel: 'Name',
          formItemPlaceholder: 'Enter name',
          formItemError: 'Name is required',
          formItemRequired: 'Required'
        },
        formItemWrapProps: {
          label: 'Name',
          name: 'name'
        }
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    expect(screen.getByTestId('AdminTableFormname0')).toBeTruthy();
    expect(screen.getByTestId('mock-input')).toBeTruthy();
  });

  it('should render multiple form items', () => {
    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' }
      },
      {
        key: 'description',
        title: 'Description',
        dataIndex: 'description',
        renderForm: 'textarea' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Description', name: 'description' }
      },
      {
        key: 'category',
        title: 'Category',
        dataIndex: 'category',
        renderForm: 'select' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Category', name: 'category' }
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    expect(screen.getByTestId('mock-input')).toBeTruthy();
    expect(screen.getByTestId('mock-textarea')).toBeTruthy();
    expect(screen.getByTestId('mock-select')).toBeTruthy();
  });

  it('should disable form items when action is detail', () => {
    (SliceStoreReact.useSliceStore as any).mockReturnValue('detail');

    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' }
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    const input = screen.getByTestId('mock-input');
    expect(input).toHaveProperty('disabled', true);
  });

  it('should not disable form items when action is create', () => {
    (SliceStoreReact.useSliceStore as any).mockReturnValue('create');

    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' }
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    const input = screen.getByTestId('mock-input');
    expect(input).toHaveProperty('disabled', false);
  });

  it('should not disable form items when action is edit', () => {
    (SliceStoreReact.useSliceStore as any).mockReturnValue('edit');

    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' }
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    const input = screen.getByTestId('mock-input');
    expect(input).toHaveProperty('disabled', false);
  });

  it('should render custom form using render function', () => {
    const customRender = vi.fn(() => (
      <div data-testid="custom-form-item">Custom Form</div>
    ));

    const options = [
      {
        key: 'custom',
        title: 'Custom',
        dataIndex: 'custom',
        renderForm: customRender,
        tt: {} as any
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    expect(screen.getByTestId('custom-form-item')).toBeTruthy();
    expect(customRender).toHaveBeenCalledTimes(1);
  });

  it('should skip options without renderForm', () => {
    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        tt: {} as any
        // No renderForm
      }
    ];

    const { container } = render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    const formItems = container.querySelectorAll('.ant-form-item');
    // Should only have the footer form items (2 buttons)
    expect(formItems.length).toBe(2);

    // Verify no option form items were rendered
    const optionFormItem = container.querySelector(
      '[data-testid="AdminTableFormname0"]'
    );
    expect(optionFormItem).toBeNull();
  });

  it('should warn when component is not found', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'nonexistent' as any,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' }
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'SchemaFormMap[nonexistent] is not found'
    );

    consoleWarnSpy.mockRestore();
  });

  it('should use context formComponents', () => {
    const contextFormComponents: any = {
      input: MockInputComponent
    };

    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' }
      }
    ];

    render(
      <ResourceTableContext.Provider
        value={{ formComponents: contextFormComponents }}
      >
        <TestWrapper
          options={options}
          tableEvent={mockTableEvent}
          tt={mockTt}
        />
      </ResourceTableContext.Provider>
    );

    expect(screen.getByTestId('mock-input')).toBeTruthy();
  });

  it('should merge context and prop formComponents', () => {
    const contextFormComponents: any = {
      input: MockInputComponent
    };

    const propFormComponents: any = {
      textarea: MockTextareaComponent
    };

    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' }
      },
      {
        key: 'description',
        title: 'Description',
        dataIndex: 'description',
        renderForm: 'textarea' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Description', name: 'description' }
      }
    ];

    render(
      <ResourceTableContext.Provider
        value={{ formComponents: contextFormComponents }}
      >
        <TestWrapper
          options={options}
          tableEvent={mockTableEvent}
          tt={mockTt}
          formComponents={propFormComponents}
        />
      </ResourceTableContext.Provider>
    );

    expect(screen.getByTestId('mock-input')).toBeTruthy();
    expect(screen.getByTestId('mock-textarea')).toBeTruthy();
  });

  it('should render custom children instead of default footer', () => {
    render(
      <TestWrapper
        options={[]}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      >
        <div data-testid="custom-footer">Custom Footer</div>
      </TestWrapper>
    );

    expect(screen.getByTestId('custom-footer')).toBeTruthy();
  });

  it('should call onSubmit when form is submitted', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <TestWrapper
        options={[]}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      >
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </TestWrapper>
    );

    const formElement = container.querySelector('form');
    expect(formElement).toBeTruthy();

    // Trigger form submit
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should use vertical layout by default', () => {
    const { container } = render(
      <TestWrapper
        options={[]}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    const formElement = container.querySelector('.ant-form-vertical');
    expect(formElement).toBeTruthy();
  });

  it('should pass additional form props', () => {
    const { container } = render(
      <TestWrapper
        options={[]}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
        className="custom-form"
      />
    );

    const formElement = container.querySelector('.custom-form');
    expect(formElement).toBeTruthy();
  });

  it('should pass formItemProps to component', () => {
    const options = [
      {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        renderForm: 'input' as const,
        tt: {} as any,
        formItemWrapProps: { label: 'Name', name: 'name' },
        formItemProps: {
          placeholder: 'Enter your name',
          maxLength: 50
        }
      }
    ];

    render(
      <TestWrapper
        options={options}
        tableEvent={mockTableEvent}
        tt={mockTt}
        formComponents={defaultFormComponents}
      />
    );

    const input = screen.getByTestId('mock-input');
    expect(input).toHaveProperty('placeholder', 'Enter your name');
    expect(input).toHaveProperty('maxLength', 50);
  });
});
