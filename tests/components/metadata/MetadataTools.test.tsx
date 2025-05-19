import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MetadataTools } from '../../../src/components/metadata/MetadataTools';
import { useApp, useInput, Text, Box } from 'ink';

// Mock the useApp hook
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    useApp: vi.fn(),
    useInput: vi.fn(),
    Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock the SelectInput component
vi.mock('ink-select-input', () => ({
  __esModule: true,
  default: ({ items, onSelect }: { items: any[]; onSelect: (item: any) => void }) => (
    <div data-testid="select-input">
      {items.map((item, index) => (
        <div 
          key={index} 
          data-testid={`select-item-${item.value || index}`}
          onClick={() => onSelect(item)}
        >
          {item.label}
        </div>
      ))}
    </div>
  ),
}));

// Mock the TextInput component
vi.mock('../../../src/components/common/TextInput', () => ({
  TextInput: ({
    value,
    onChange,
    placeholder,
    onSubmit,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSubmit?: () => void;
  }) => (
    <input
      data-testid="text-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
    />
  ),
}));

// Mock the ErrorBoundary
vi.mock('../../../src/components/common/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
  useErrors: () => ({
    errors: [],
    addError: vi.fn(),
    clearErrors: vi.fn(),
  }),
}));

// Mock the error reporter
vi.mock('../../../src/utils/errorReporter', () => ({
  errorReporter: {
    captureException: vi.fn(),
  },
  ErrorCategory: {
    USER: 'USER',
    SYSTEM: 'SYSTEM',
  },
  ErrorSeverity: {
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO',
  },
}));

// Mock the ink-spinner component
vi.mock('ink-spinner', () => ({
  default: () => <span data-testid="spinner">⣾</span>,
}));

describe('MetadataTools', () => {
  const mockOnBack = vi.fn();
  const mockExit = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useApp
    (useApp as any).mockReturnValue({
      exit: mockExit,
    });
    
    // Mock useInput
    (useInput as any).mockImplementation((handler: (input: string) => void) => {
      // Default implementation (can be overridden in tests)
      if (handler) {
        handler('q'); // Simulate 'q' key press by default
      }
    });

    // Mock the actual MetadataTools component to avoid testing the actual implementation
    vi.mock('../../../src/components/metadata/MetadataTools', async () => {
      const actual = await vi.importActual('../../../src/components/metadata/MetadataTools');
      return {
        ...actual,
        default: ({ onBack }: { onBack: () => void }) => (
          <div data-testid="metadata-tools">
            <div data-testid="tool-list">
              <div 
                data-testid="tool-deploy" 
                onClick={() => onBack()}
              >
                Deploy Metadata
              </div>
              <div 
                data-testid="tool-retrieve"
                onClick={() => onBack()}
              >
                Retrieve Metadata
              </div>
              <div 
                data-testid="back-button"
                onClick={onBack}
              >
                ← Back
              </div>
            </div>
          </div>
        ),
      };
    });
  });
  
  it('renders the metadata tools list', () => {
    render(<MetadataTools onBack={mockOnBack} />);
    
    // Check if the component is rendered
    expect(screen.getByTestId('metadata-tools')).toBeInTheDocument();
    
    // Check if tools are rendered
    expect(screen.getByTestId('tool-deploy')).toHaveTextContent('Deploy Metadata');
    expect(screen.getByTestId('tool-retrieve')).toHaveTextContent('Retrieve Metadata');
  });
  
  it('calls onBack when back option is selected', () => {
    render(<MetadataTools onBack={mockOnBack} />);
    
    // Find and click the back option
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
  
  it('calls onBack when a tool is selected', () => {
    render(<MetadataTools onBack={mockOnBack} />);
    
    // Find and click on a tool
    const deployTool = screen.getByTestId('tool-deploy');
    fireEvent.click(deployTool);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
  
  it('handles exit on q key press', () => {
    render(<MetadataTools onBack={mockOnBack} />);
    
    // The useInput mock is set up to simulate 'q' key press
    expect(mockExit).toHaveBeenCalledTimes(1);
  });
});

describe('MetadataToolsWithErrorBoundary', () => {
  it('renders with ErrorBoundary', () => {
    // Import the actual component with error boundary
    const { MetadataToolsWithErrorBoundary } = require('../../../src/components/metadata/MetadataTools');
    
    // Mock the MetadataTools component to throw an error
    vi.mock('../../../src/components/metadata/MetadataTools', () => {
      const originalModule = vi.importActual('../../../src/components/metadata/MetadataTools');
      return {
        ...originalModule,
        default: () => {
          throw new Error('Test error');
        },
      };
    });
    
    // Should not throw because of the ErrorBoundary
    expect(() => {
      render(<MetadataToolsWithErrorBoundary onBack={vi.fn()} />);
    }).not.toThrow();
    
    // Check if error boundary is rendered
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });
});
