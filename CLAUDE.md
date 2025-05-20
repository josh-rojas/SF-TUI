# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SF TUI - Project Overview & Development Guide

## Project Description
SF TUI is a modern, interactive terminal-based interface for Salesforce development. It provides a user-friendly way to interact with Salesforce CLI commands, making it easier for developers and admins to manage their Salesforce orgs and projects without memorizing complex CLI commands.

## Key Commands

### Development Workflow
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode with hot-reloading
npm run dev

# Run the app directly
node dist/index.js

# Format code with ESLint
npm run lint
```

### Testing Commands
```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test patterns
npm test -- PathToTestFile.test.tsx
npm test -- -t "test description pattern"

# Run only error-related tests
npm run test:errors

# Run end-to-end tests
npm run test:e2e

# Run E2E tests with debug output
DEBUG_E2E=true npm run test:e2e
```

## Architecture Overview

SF TUI is a React-based Terminal UI application built with the following architecture:

1. **Component-Based Structure**
   - Uses Ink (React for the terminal) to render interactive terminal UI
   - React components follow functional approach with hooks
   - Error boundaries prevent UI crashes

2. **Command Execution System**
   - Wrapper for Salesforce CLI commands using `execa`
   - Provides progress indicators during long-running operations
   - Captures and formats output for display in the terminal

3. **Caching Layer**
   - Caches results of read-only commands to improve performance
   - Automatically invalidates cache for write operations
   - Configurable with TTL (time-to-live) and max cache size

4. **Error Handling & Logging**
   - Centralized error reporting system with severity levels
   - Robust logging with both console and file output
   - Log rotation and management for production use
   - Error recovery mechanism for critical operations

5. **Testing Framework**
   - Unit tests with Vitest for component and utility testing
   - E2E tests that verify navigation and command flows
   - Custom testing utils for terminal UI testing

## Core Data Flows

1. **Command Execution Flow**
   - User selects command in TUI → Command parameters collected → 
   - Command execution with loading UI → Results processed → 
   - Data displayed in appropriate format

2. **Authentication Flow**
   - Auth requested → OAuth flow initiated → 
   - Tokens stored securely → Org added to list

3. **Metadata Operation Flow**
   - Org selection → Metadata type/component selection → 
   - Action selection (deploy/retrieve) → Command execution → 
   - Results displayed with success/error state

## Critical Files & Components

- **Entry points:**
  - `src/index.ts`: Main application entry
  - `src/App.tsx`: Root React component

- **Core components:**
  - `src/components/MainMenu.tsx`: Central navigation hub
  - `src/components/org/OrgManager.tsx`: Org connection & management
  - `src/components/metadata/MetadataTools.tsx`: Metadata operations
  - `src/components/run/RunTools.tsx`: SOQL, Apex, etc. execution

- **Important utilities:**
  - `src/utils/commandExecutor.ts`: Executes Salesforce CLI commands
  - `src/utils/logger.ts`: Logging system
  - `src/utils/cache.ts`: Command result caching
  - `src/utils/errorReporter.ts`: Error handling & reporting

- **Test framework:**
  - `tests/setup.ts`: Test environment configuration
  - `tests/e2e/setup.ts`: E2E test utilities
  - `tests/e2e/e2eUtils.ts`: Support functions for E2E testing

## Guidelines for Code Modifications

1. **Adding New Commands**
   - Add new command file in `src/commands/`
   - Update command registry if needed
   - Add appropriate UI component in `src/components/`
   - Write tests for both the command and UI

2. **Modifying UI Components**
   - Follow existing pattern of functional components with hooks
   - Ensure error boundaries are in place
   - Use proper theme styling from `src/themes/`

3. **Error Handling**
   - Use try/catch blocks for async operations
   - Use the `errorReporter` singleton for consistent error reporting
   - Add appropriate user-facing error displays

4. **Testing Requirements**
   - Unit tests for new utils and components
   - For UI components, test both rendering and interactions
   - For commands, test with mocked `execa` responses
   - Add E2E tests for new user-facing flows

5. **Configuration Management**
   - Honor environment variables for configuration when appropriate
   - Add validation for configuration parameters
   - Provide sensible defaults for all configuration settings

## Common Patterns

1. **React Hooks Usage**
   - Use existing custom hooks in `src/hooks/`
   - Create new hooks for reusable logic following the pattern

2. **Error Handling Pattern**
   ```typescript
   try {
     // Async operation
     const result = await someOperation();
     return result;
   } catch (error) {
     // Use the errorReporter or logger
     errorReporter.reportError({
       message: "Failed to perform operation",
       error: error as Error,
       severity: "error", // or "warning", "critical", etc.
       context: { additionalInfo: "helpful context" }
     });
     
     // User-facing feedback
     return { error: "Operation failed. Please try again." };
   }
   ```

3. **Command Execution Pattern**
   ```typescript
   import { executeCommand } from '../utils/commandExecutor';
   
   const result = await executeCommand(
     'sf', 
     ['org', 'list', '--json'], 
     { showOutput: true, cacheResult: true }
   );
   ```

4. **E2E Testing Pattern**
   ```typescript
   import { describe, it, expect, beforeAll, afterAll } from 'vitest';
   import { setupE2E } from './setup';
   
   describe('Some Feature Flow', () => {
     let e2e;
     
     beforeAll(async () => {
       e2e = await setupE2E();
     });
     
     afterAll(async () => {
       await e2e.cleanup();
     });
     
     it('should navigate to target screen and perform action', async () => {
       await e2e.navigateTo('targetScreen');
       expect(e2e).toContainOutput('Expected Content');
       
       // Simulate user input
       e2e.sendInput('some input');
       await e2e.waitForText('Expected Result');
     });
   });
   ```

## Environment Variables

- `SF_TUI_LOG_LEVEL`: Sets logging level (DEBUG, INFO, WARN, ERROR, FATAL)
- `SF_TUI_CONSOLE_OUTPUT`: Enable/disable console logging (true/false)
- `SF_TUI_FILE_OUTPUT`: Enable/disable file logging (true/false)
- `SF_TUI_LOG_FILE`: Custom log file path
- `SF_TUI_MAX_LOG_FILE_SIZE`: Maximum log file size in bytes
- `SF_TUI_MAX_LOG_FILES`: Maximum number of rotated log files to keep
- `DEBUG_E2E`: Enable detailed output during E2E tests
- `TTY`: Force TTY mode during tests (set to "1")
- `SFTUI_CONFIG_DIR`: Custom config directory location