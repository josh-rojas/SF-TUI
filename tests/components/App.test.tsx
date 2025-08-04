import React from 'react';
import { render, screen, act } from '../renderWithInk';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../src/App';
import * as configUtils from '../../src/utils/config';
import { fireEvent } from '@testing-library/react';

// Mock child components and utils
vi.mock('../../src/components/SplashScreen', () => ({
  __esModule: true,
  default: ({ onComplete }: { onComplete: () => void }) => {
    React.useEffect(() => {
      onComplete();
    }, [onComplete]);
    return <div>SplashScreen</div>;
  },
}));

vi.mock('../../src/components/FirstTimeWizard', () => ({
  __esModule: true,
  FirstTimeWizardWithErrorBoundary: ({ onComplete }: { onComplete: (data: any) => void }) => {
    React.useEffect(() => {
      onComplete({ user: { fullName: 'Test User', defaultOrg: 'test-org', enableAnalytics: true, theme: 'dark' } });
    }, [onComplete]);
    return <div>FirstTimeWizard</div>;
  },
}));

vi.mock('../../src/components/MainMenu', () => ({
  __esModule: true,
  default: () => <div>MainMenu</div>,
}));

vi.mock('../../src/components/common/HelpScreen', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>CloseHelp</button>,
}));

const loadConfigMock = vi.spyOn(configUtils, 'loadConfig');
const markFirstRunCompleteMock = vi.spyOn(configUtils, 'markFirstRunComplete');

describe('<App />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show MainMenu for returning users', async () => {
    loadConfigMock.mockResolvedValue({ firstRun: false });

    render(<App />);

    const mainMenu = await screen.findByText('MainMenu');
    expect(mainMenu).toBeDefined();
    expect(loadConfigMock).toHaveBeenCalledTimes(1);
    expect(markFirstRunCompleteMock).not.toHaveBeenCalled();
  });

  it('should show FirstTimeWizard on first run', async () => {
    loadConfigMock.mockResolvedValueOnce({ firstRun: true }).mockResolvedValueOnce({ firstRun: false });

    render(<App />);

    const wizard = await screen.findByText('FirstTimeWizard');
    expect(wizard).toBeDefined();

    // After wizard completion, it should show the main menu
    const mainMenu = await screen.findByText('MainMenu');
    expect(mainMenu).toBeDefined();

    expect(loadConfigMock).toHaveBeenCalledTimes(2);
    expect(markFirstRunCompleteMock).toHaveBeenCalledTimes(1);
  });
});
