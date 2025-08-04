/**
 * @vitest-environment node
 */
import React, { useState } from 'react';
import { render } from 'ink-testing-library';
import { NotificationProvider, useNotifications, NotificationCenter } from '../../src/context/NotificationContext';
import { ThemeProvider } from '../../src/themes';
import { useInput } from 'ink';
import { vi } from 'vitest';

// Mock useInput to allow simulating key presses
vi.mock('ink', async () => {
    const originalInk = await vi.importActual<typeof import('ink')>('ink');
    return {
        ...originalInk,
        useInput: vi.fn(),
    };
});

const mockedUseInput = vi.mocked(useInput);

// Helper to get the input handler from the useInput mock
const getPressHandler = () => {
    const call = mockedUseInput.mock.calls[mockedUseInput.mock.calls.length - 1];
    if (!call) {
        throw new Error('useInput was not called');
    }
    return call[0];
};

const TestComponent = () => {
    const { showNotification, updateNotification, dismissNotification, dismissAll } = useNotifications();
    const [notificationId, setNotificationId] = useState<string | null>(null);

    useInput((input) => {
        console.log(`--- INPUT RECEIVED IN COMPONENT: ${input} ---`);
        if (input === 's') {
            showNotification({
                type: 'success',
                title: 'Success',
                message: 'Auto-dismiss notification',
                autoDismiss: true,
                dismissAfter: 5000,
            });
        }
        if (input === 'm') {
            const id = showNotification({
                type: 'info',
                title: 'Manual',
                message: 'Manual dismiss notification',
            });
            setNotificationId(id);
        }
        if (input === 'd' && notificationId) {
            dismissNotification(notificationId);
        }
        if (input === 'p') {
            const id = showNotification({
                type: 'progress',
                title: 'Progress',
                message: 'Uploading...',
                progress: 0,
            });
            setNotificationId(id);
        }
        if (input === 'u' && notificationId) {
            updateNotification(notificationId, { progress: 50, message: 'Updated!' });
        }
        if (input === 'a') {
            dismissAll();
        }
    });

    return <NotificationCenter />;
};

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <ThemeProvider>
            <NotificationProvider>
                {component}
            </NotificationProvider>
        </ThemeProvider>
    );
};


describe('NotificationContext with ink-testing-library', () => {
    afterEach(() => {
        vi.useRealTimers();
        mockedUseInput.mockClear();
    });

    it('should show and auto-dismiss a notification', () => {
        vi.useFakeTimers();
        const { lastFrame, unmount } = renderWithProviders(<TestComponent />);

        const inputHandler = getPressHandler();
        console.log('--- CALLING INPUT HANDLER ---');
        React.act(() => inputHandler('s', { meta: false, ctrl: false, shift: false }));
        console.log('--- CALLED INPUT HANDLER ---');

        console.log('--- LAST FRAME OUTPUT ---');
        console.log(lastFrame());
        console.log('--- END LAST FRAME OUTPUT ---');

        expect(lastFrame()).toContain('Auto-dismiss notification');

        React.act(() => vi.advanceTimersByTime(5000));
        React.act(() => vi.advanceTimersByTime(300)); // animation

        expect(lastFrame()).not.toContain('Auto-dismiss notification');
        unmount();
    });

    it('should allow manually dismissing a notification', () => {
        vi.useFakeTimers();
        const { lastFrame, unmount } = renderWithProviders(<TestComponent />);
        const inputHandler = getPressHandler();

        React.act(() => inputHandler('m', { meta: false, ctrl: false, shift: false }));
        expect(lastFrame()).toContain('Manual dismiss notification');

        React.act(() => inputHandler('d', { meta: false, ctrl: false, shift: false }));
        React.act(() => vi.advanceTimersByTime(300)); // animation

        expect(lastFrame()).not.toContain('Manual dismiss notification');
        unmount();
    });

    it('should update a notification', () => {
        const { lastFrame, unmount } = renderWithProviders(<TestComponent />);
        const inputHandler = getPressHandler();

        React.act(() => inputHandler('p', { meta: false, ctrl: false, shift: false }));
        expect(lastFrame()).toContain('Uploading...');
        expect(lastFrame()).toContain('0%');

        React.act(() => inputHandler('u', { meta: false, ctrl: false, shift: false }));
        expect(lastFrame()).toContain('Updated!');
        expect(lastFrame()).toContain('50%');
        unmount();
    });

    it('should dismiss all notifications', () => {
        vi.useFakeTimers();
        const { lastFrame, unmount } = renderWithProviders(<TestComponent />);
        const inputHandler = getPressHandler();

        React.act(() => inputHandler('s', { meta: false, ctrl: false, shift: false }));
        React.act(() => inputHandler('m', { meta: false, ctrl: false, shift: false }));

        expect(lastFrame()).toContain('Auto-dismiss notification');
        expect(lastFrame()).toContain('Manual dismiss notification');

        React.act(() => inputHandler('a', { meta: false, ctrl: false, shift: false }));
        React.act(() => vi.advanceTimersByTime(300)); // animation

        expect(lastFrame()).not.toContain('Auto-dismiss notification');
        expect(lastFrame()).not.toContain('Manual dismiss notification');
        unmount();
    });
});
