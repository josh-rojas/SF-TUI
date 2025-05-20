# SF TUI - Salesforce Terminal UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, interactive terminal-based interface for Salesforce development. SF TUI provides a user-friendly way to interact with Salesforce CLI commands, making it easier for developers and admins to manage their Salesforce orgs and projects without memorizing complex CLI commands.

![SF TUI Demo](docs/demo.gif)

## ✨ Features

- 🏢 **Org Management**: List, connect, and manage your Salesforce orgs
- 🚀 **Project Tools**: Create and manage Salesforce projects and packages
- 🔐 **Authentication**: Easily authenticate with your orgs
- 🏷️ **Alias Management**: Manage your Salesforce CLI aliases
- 📦 **Metadata Tools**: Deploy, retrieve, and manage metadata
- ⚡ **Run Tools**: Execute Apex, Flows, and SOQL queries
- 🧩 **Plugin Management**: View and manage your CLI plugins
- 💾 **Response Caching**: Improve performance with smart command caching
- 🎨 **Theme Support**: Customize your experience with different themes
- ⌨️ **Keyboard Shortcuts**: Navigate efficiently with keyboard shortcuts
- 🧙 **First-Run Wizard**: Guided onboarding for new users
- 💡 **Splash Screen**: Branded loading and first-run experience
- 🛡️ **Robust Error Handling**: Error boundaries and user-friendly recovery
- 📊 **Progress Tracking**: Visual progress bars for long-running operations
- 🔔 **Notification System**: Toast-style notifications for operation results

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later
- [Salesforce CLI (sf)](https://developer.salesforce.com/tools/sfdxcli) installed and configured

### Installation

```bash
# Install globally
npm install -g sf-tui

# Or install locally in a project
npm install --save-dev sf-tui
```

If installing from source:

```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/sf-tui.git
cd sf-tui

# Install dependencies
npm install

# Build the project
npm run build

# Link the package globally
npm link
```

### Usage

```bash
# Start the TUI
sft

# Show help
sft --help

# Show version
sft --version

# Enable debug logging
DEBUG=* sft
```

---

## 🧙 First-Run Experience & Splash Screen

- On first launch, SF TUI displays a splash screen and a guided setup wizard
- The wizard collects your preferences and configures the app for your workflow
- It creates a config file at `~/.sftui/config.json` with your settings
- Returning users go straight to the main menu

---

## 🗂 Configuration

SF TUI can be configured in multiple ways:

### User Configuration

- Config is stored in `~/.sftui/config.json` by default
- You can edit this file manually or through the settings menu in the app
- If the config is missing or corrupted, SF TUI will prompt you to reconfigure

### Environment Variables

SF TUI supports the following environment variables:

- `SF_TUI_LOG_LEVEL`: Sets logging level (DEBUG, INFO, WARN, ERROR, FATAL)
- `SF_TUI_CONSOLE_OUTPUT`: Enable/disable console logging (true/false)
- `SF_TUI_FILE_OUTPUT`: Enable/disable file logging (true/false)
- `SF_TUI_LOG_FILE`: Custom log file path
- `SF_TUI_MAX_LOG_FILE_SIZE`: Maximum log file size in bytes
- `SF_TUI_MAX_LOG_FILES`: Maximum number of rotated log files to keep
- `DEBUG`: Enable verbose debug output when set to any value
- `SFTUI_CONFIG_DIR`: Specify a custom config directory location

---

## 🛡️ Error Handling & Logging

SF TUI provides robust error handling and comprehensive logging:

### Error Handling

- Structured error reporting with severity levels
- User-friendly error notifications with suggested fixes
- Error boundaries to prevent application crashes
- Recovery options for common error scenarios

### Logging

- Multi-level logging (DEBUG, INFO, WARN, ERROR, FATAL)
- File and console output with rotation
- Logs stored in `~/.sf-tui/logs/sf-tui.log` by default
- Structured format with timestamps, levels, and context

---

## ⌨️ Keyboard Shortcuts

SF TUI is designed for keyboard-driven operation:

- **Global shortcuts**:
  - `?`: Show help screen
  - `q`/`Esc`: Go back/exit current screen
  - `Ctrl+C`: Exit application
  - `Alt+T`: Toggle theme
  - `Alt+S`: Toggle status bar

- **Context-specific shortcuts** are displayed at the bottom of each screen
- All shortcuts can be customized in the settings menu

---

## 🖥️ Screenshots

### Main Menu
![Main Menu](docs/main-menu.png)

### Org Management
![Org Management](docs/org-management.png)

### Metadata Tools
![Metadata Tools](docs/metadata-tools.png)

---

## 🧩 Architecture

SF TUI is built on a modern React-based architecture:

### Core Components

1. **React + Ink UI Layer**
   - Uses Ink (React for the terminal) to render interactive terminal UI
   - Component hierarchy with context providers for state management
   - Error boundaries to prevent UI crashes

2. **Command Execution System**
   - Wrapper for Salesforce CLI commands using `execa`
   - Progress indicators for long-running operations
   - Result formatting and display

3. **Performance Optimizations**
   - Command result caching with automatic invalidation
   - Efficient rendering with React hooks
   - Asynchronous operations with loading indicators

4. **State Management**
   - React Context API for global state
   - Custom hooks for reusable logic
   - Consistent patterns across components

---

## 🛠 Development

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/sf-tui.git
cd sf-tui

# Install dependencies
npm install

# Run in development mode with hot-reloading
npm run dev
```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Run in development mode with hot-reloading
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:errors` - Run only error-related tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint

### Project Structure

- `src/`: Main source code
  - `commands/`: CLI command implementations
  - `components/`: Reusable UI components
    - `common/`: Shared UI components
    - `org/`: Org management components
    - `project/`: Project tools
    - `auth/`: Authentication flows
    - `metadata/`: Metadata operations
    - `run/`: Code execution tools
    - `plugins/`: Plugin management
  - `context/`: React context providers
  - `themes/`: Styling and theming
  - `hooks/`: Custom React hooks
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
  - `config/`: Application configuration
- `tests/`: Test files
  - `components/`: Component tests
  - `e2e/`: End-to-end tests
  - `integration/`: Integration tests
  - `utils/`: Utility tests
- `dist/`: Build output

---

## 🧪 Testing

SF TUI uses a comprehensive testing strategy to ensure code quality and reliability.

### Unit Tests

Run unit tests with:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.tsx

# Run tests matching pattern
npm test -- -t "test pattern"
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

### End-to-End Tests

E2E tests validate navigation flows and interactions with the terminal UI:

```bash
# Run E2E tests
npm run test:e2e

# Run with debug output
DEBUG_E2E=true npm run test:e2e
```

### Test Coverage

Generate a test coverage report:

```bash
npm run test:coverage
```

### Writing Tests

- **Unit Tests**: For utility functions and individual components
- **E2E Tests**: For navigation flows and user interactions

Example E2E test:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2E } from './setup';

describe('Navigation Flow', () => {
  let e2e;
  
  beforeAll(async () => {
    e2e = await setupE2E();
  });
  
  afterAll(async () => {
    await e2e.cleanup();
  });
  
  it('should navigate to Org Manager', async () => {
    await e2e.navigateTo('org');
    expect(e2e).toContainOutput('Org Manager');
  });
});
```

---

## 📦 Performance Features

### Response Caching

SF TUI includes a smart caching system that:

- Caches results of read-only commands to improve performance
- Automatically invalidates cache for write operations
- Configurable TTL and max cache size
- Respects configuration settings for commands that should never be cached

Configure caching in your `~/.sftui/config.json`:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 300000,
    "maxSize": 10485760,
    "commandCache": {
      "enabled": true,
      "exclude": ["deploy", "retrieve", "push", "pull"]
    }
  }
}
```

---

## 🛠️ Troubleshooting

- **App does not start:** Ensure Node.js, npm, and Salesforce CLI are installed and on your PATH.
- **Config errors:** Delete or fix `~/.sftui/config.json` and restart SF TUI to trigger the setup wizard.
- **Terminal rendering issues:** Try a different terminal emulator or update your terminal.
- **Log locations:**
  - Default user config: `~/.sftui/config.json`
  - Default logs: `~/.sf-tui/logs/sf-tui.log`
- **Debug mode:** Run with `DEBUG=* sft` for verbose logs.

---

## 🧩 Tech Stack

- **Language**: TypeScript
- **UI Framework**: [Ink](https://github.com/vadimdemedes/ink) (React for CLIs)
- **CLI Framework**: [oclif](https://oclif.io/)
- **Process Manager**: [execa](https://github.com/sindresorhus/execa)
- **Build Tool**: [tsup](https://github.com/egoist/tsup)
- **Testing**: [Vitest](https://vitest.dev/)
- **Terminal Styling**: [chalk](https://github.com/chalk/chalk)

---

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [oclif](https://oclif.io/), [Ink](https://github.com/vadimdemedes/ink), and TypeScript
- Inspired by tools like [gh](https://cli.github.com/) and [lazydocker](https://github.com/jesseduffield/lazydocker)

---

Made with ❤️ for the Salesforce community