import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { AliasManager } from '../../src/components/alias/AliasManager';
import { execa } from 'execa';

vi.mock('execa', () => ({ execa: vi.fn() }));
vi.mock('ink-spinner', () => ({ default: () => null }));

const mockExeca = execa as unknown as vi.Mock;

describe('AliasManager', () => {
  it('renders aliases', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: JSON.stringify({ status: 0, result: { test: 'user@example.com' } }) });
    const { lastFrame } = render(<AliasManager onBack={() => {}} />);
    await new Promise(r => setTimeout(r, 0));
    expect(lastFrame()).toContain('test = user@example.com');
  });
});
