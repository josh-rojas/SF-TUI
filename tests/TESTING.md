# Testing Guide for SF TUI

This document explains how to write and run tests for the SF TUI project.

## Test Setup

The test environment uses:
- Vitest as the test runner and assertion library
- JSDOM for simulating a DOM environment
- Mocks for various terminal and filesystem operations

### Global Mocks

Several libraries are mocked globally in `tests/setup.ts`:

- `ink` - Mock implementation of Ink components and hooks
- `chalk` - Mock implementation of chalk for styling terminal output
- `execa` - Mock implementation for executing shell commands
- `fs` - Mock implementation for filesystem operations
- `ink-spinner` - Mock implementation for spinner component

### Test Utilities

We provide several utilities to help with testing:

- `createInkMock()` - Sets up mocks for Ink and React components
- `createMockErrorReport()` - Creates a fake error report for testing error handling
- `mockFileSystem()` - Creates an in-memory file system for testing file operations

## E2E Testing

For end-to-end testing, use the utilities in `tests/e2e/e2eUtils.ts`:

- `createE2ETestEnvironment()` - Creates a test environment with mocked stdin/stdout
- `renderForE2E()` - Renders a component for E2E testing

Example:

```typescript
import { createE2ETestEnvironment, renderForE2E } from './e2eUtils';

const e2e = createE2ETestEnvironment();

describe('Component E2E Tests', () => {
  beforeEach(() => {
    e2e.setupMocks();
  });
  
  afterEach(() => {
    e2e.cleanupMocks();
  });
  
  it('should do something', async () => {
    const { getByText } = renderForE2E(<MyComponent />);
    
    // Find elements
    expect(getByText(/Some Text/)).toBeDefined();
    
    // Simulate key presses
    e2e.simulateKeyPress('return');
    
    // Check output
    expect(e2e.getOutput()).toContain('Expected output');
  });
});
```

## Component Testing

For component testing, use the React Testing Library utilities:

```typescript
import { render } from '@testing-library/react';
import { MyComponent } from '../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeDefined();
  });
});
```

## Tips for Writing Tests

1. **Mock external dependencies**: Always mock external dependencies like filesystem, CLI commands, etc.
2. **Test in isolation**: Each test should be independent and not rely on other tests
3. **Test user interactions**: For UI components, test user interactions like key presses
4. **Test error cases**: Always test error cases and edge cases
5. **Keep tests focused**: Each test should test one specific feature or behavior

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/path/to/test.ts

# Run tests with coverage
npm run test:coverage
```

## Known Limitations

- Terminal-specific features can be challenging to test
- Some tests may be flaky due to timing issues
- React Testing Library doesn't fully support Ink components natively