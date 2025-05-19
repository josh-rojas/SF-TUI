# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SF TUI - Project Overview & Development Guide

## Project Description
SF TUI is a modern, interactive terminal-based interface for Salesforce development. It provides a user-friendly way to interact with Salesforce CLI commands, making it easier for developers and admins to manage their Salesforce orgs and projects without memorizing complex CLI commands.

## Key Components

### Core Features
- **Org Management**: Connect to and manage multiple Salesforce orgs
- **Project Tools**: Create and manage Salesforce projects
- **Authentication**: Secure org authentication flows
- **Metadata Operations**: Deploy and retrieve metadata
- **Development Tools**: Execute Apex, Flows, and more
- **Plugin Management**: View and manage CLI plugins

### Technical Stack
- **Language**: TypeScript
- **UI Framework**: Ink (React for CLIs)
- **CLI Framework**: oclif
- **Build Tool**: tsup
- **Testing**: Vitest
- **Linting/Formatting**: ESLint & Prettier

## Project Structure
- `src/`: Main source code
  - `commands/`: CLI command implementations
  - `components/`: Reusable UI components
  - `themes/`: Styling and theming
  - `hooks/`: Custom React hooks
  - `utils/`: Utility functions

## Development Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode with hot-reloading
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Format code with Prettier
npm run format
```

## Development Plan

### Phase 1: Setup & Foundation (Priority: High) ✅
1. **Fix TypeScript and Dependency Issues** ✅
   ```bash
   # Install missing type definitions
   npm install --save-dev @types/execa @types/react @types/react-dom @types/node
   ```
   - ✅ TextInput component references fixed in MetadataTools, RunTools, and PluginsPanel
   - ✅ Type errors resolved

2. **Implement Basic Component Infrastructure** ✅
   - ✅ Common component implementations complete (TextInput, Button, etc.)
   - ✅ Theming support across all components

### Phase 2: Core Features Implementation (Priority: High)
1. **Complete Org Manager** ✅
   - ✅ Org deletion implementation fixed
   - ✅ Refresh capability for org list added
   - ✅ Error handling for failed operations implemented

2. **Enhance Metadata Tools** ✅
   - ✅ Dummy data replaced with actual org loading
   - ✅ Progress tracking for long-running operations implemented
   - ✅ Validation for input fields added

3. **Improve Run Tools** ✅
   - ✅ Apex execution implementation completed
   - ✅ Flow execution support added
   - ✅ SOQL query results visualization implemented

4. **Enhance Plugin Management** ✅
   - ✅ Plugin installation, update, and removal functionality completed
   - ✅ Plugin search capability added
   - ✅ Error handling for plugin operations improved

### Phase 3: Testing & Documentation (Priority: Medium)
1. **Testing Infrastructure**
   - Set up component testing with Vitest
   - Configure test coverage reporting
   ```bash
   # Run tests with coverage
   npm test -- --coverage
   ```
   - Add integration tests for CLI commands

2. **Documentation**
   - Add JSDoc comments to all components and utilities
   - Update README with comprehensive setup instructions
   - Create contribution guidelines
   - Document common patterns and best practices

### Phase 4: Finalization & Distribution (Priority: Low)
1. **CI/CD Setup**
   - Configure GitHub Actions workflow
   - Set up automated testing
   - Configure release process

2. **Performance Optimization**
   - Analyze and improve component rendering performance
   - Optimize CLI command execution
   - Add caching for frequently accessed data

3. **User Experience Enhancements**
   - Implement keyboard shortcuts
   - Add onboarding/help screens
   - Create a dark mode theme

## Coding Guidelines

1. **Component Structure**
   - Use functional components with hooks
   - Keep components focused on a single responsibility
   - Extract reusable logic into custom hooks

2. **Error Handling**
   - Always provide meaningful error messages
   - Use try/catch blocks for async operations
   - Implement user-friendly error displays

3. **Styling Conventions**
   - Use the theme system for all styling
   - Follow the Salesforce Lightning Design System color palette
   - Maintain consistent spacing and layout

4. **Performance Considerations**
   - Minimize rerenders with React.memo and useMemo where appropriate
   - Keep terminal UI responsive by avoiding blocking operations
   - Use async/await for all file system and network operations

## Technical Requirements
- Node.js 18 or later
- npm 9 or later
- Salesforce CLI (sf) installed and configured

## Architecture

The application follows a component-based architecture using React with Ink for terminal rendering:
- **Entry point**: `src/index.ts` - Initializes the CLI application
- **Commands**: `src/commands/` - CLI command implementations
- **Components**:
  - `common/`: Reusable UI components
  - `org/`: Org management components
  - `project/`: Project tools
  - `auth/`: Authentication flows
  - `metadata/`: Metadata operations
  - `run/`: Code execution tools
  - `plugins/`: Plugin management

## Core Design Patterns

1. **Error Handling System**
   - Centralized error reporting via `errorReporter` singleton
   - Error severity levels and categories to classify issues
   - User-friendly error notifications with dismissal options
   - Error boundaries to prevent UI crashes

2. **Logging Infrastructure**
   - Multi-level logging system (DEBUG, INFO, WARN, ERROR, FATAL)
   - File and console logging with rotation support
   - Structured log format with timestamp, level, message, and optional details

3. **Command Execution**
   - Wrapper for Salesforce CLI commands using `execa`
   - Loading indicators during command execution
   - Output capture and display
   - Error handling for failed commands

4. **UI Component Structure**
   - Common components in `src/components/common/`
   - Feature-specific components in dedicated directories
   - React hooks for state management
   - Consistent navigation with back button support