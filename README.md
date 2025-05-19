# SF TUI - Salesforce Terminal UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, interactive terminal-based interface for Salesforce development. SF TUI provides a user-friendly way to interact with Salesforce CLI commands, making it easier for developers and admins to manage their Salesforce orgs and projects without memorizing complex CLI commands.

![SF TUI Demo](https://raw.githubusercontent.com/yourusername/sf-tui/main/docs/demo.gif)

## ✨ Features

- 🏢 **Org Management**: List, connect, and manage your Salesforce orgs
- 🚀 **Project Tools**: Create and manage Salesforce projects and packages
- 🔐 **Authentication**: Easily authenticate with your orgs
- 🏷️ **Alias Management**: Manage your Salesforce CLI aliases
- 📦 **Metadata Tools**: Deploy, retrieve, and manage metadata
- ⚡ **Run Tools**: Execute Apex, Flows, and more
- 🧩 **Plugin Management**: View and manage your CLI plugins
- 💾 **Response Caching**: Improve performance with smart command caching
- 🎨 **Theme Support**: Customize your experience with different themes
- ⌨️ **Keyboard Shortcuts**: Navigate efficiently with keyboard shortcuts

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- Salesforce CLI (sf) installed and configured

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
git clone https://github.com/yourusername/sf-tui.git
cd sf-tui

# Install dependencies
npm install

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
```

## 🖥️ Screenshots

### Main Menu
![Main Menu](https://raw.githubusercontent.com/yourusername/sf-tui/main/docs/main-menu.png)

### Org Management
![Org Management](https://raw.githubusercontent.com/yourusername/sf-tui/main/docs/org-management.png)

### Metadata Tools
![Metadata Tools](https://raw.githubusercontent.com/yourusername/sf-tui/main/docs/metadata-tools.png)

## 🛠 Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/sf-tui.git
cd sf-tui

# Install dependencies
npm install

# Fix TypeScript type definitions (if needed)
npm install --save-dev @types/execa @types/react @types/react-dom @types/node
```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Run in development mode with hot-reloading
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
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
  - `themes/`: Styling and theming
  - `hooks/`: Custom React hooks
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions

## 🧪 Testing

SF TUI uses a comprehensive testing strategy to ensure code quality and reliability.

### Unit Tests

Run unit tests with:

```bash
npm test
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

### Writing Tests

- **Unit Tests**: For utility functions and individual components
- **E2E Tests**: For navigation flows and user interactions
  - Use the `setupE2E` helper from `tests/e2e/setup.ts`
  - Test common user flows by sending keyboard inputs and asserting on outputs

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

### Cache Testing

Test command caching behavior with:

```bash
npm run test:cache
```

This runs specialized tests to verify caching, including TTL behavior, invalidation, and size management.

## 🧩 Tech Stack

- **Language**: TypeScript
- **UI Framework**: [Ink](https://github.com/vadimdemedes/ink) (React for CLIs)
- **CLI Framework**: [oclif](https://oclif.io/)
- **Build Tool**: [tsup](https://github.com/egoist/tsup)
- **Testing**: [Vitest](https://vitest.dev/)

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

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [oclif](https://oclif.io/), [Ink](https://github.com/vadimdemedes/ink), and TypeScript
- Inspired by tools like [gh](https://cli.github.com/) and [lazydocker](https://github.com/jesseduffield/lazydocker)

---

Made with ❤️ for the Salesforce community