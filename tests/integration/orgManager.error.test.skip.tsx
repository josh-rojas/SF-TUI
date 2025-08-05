import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { OrgManager } from '../../src/components/org/OrgManager';
import { execa } from 'execa';

vi.mock('execa', () => ({ execa: vi.fn() }));
const mockExeca = execa as unknown as vi.Mock;

describe('OrgManager', () => {
  it('shows message when no orgs', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: JSON.stringify({ status: 0, result: { nonScratchOrgs: [], scratchOrgs: [] } }) });
    const { lastFrame } = render(<OrgManager onBack={() => {}} />);
    await new Promise(r => setTimeout(r, 0));
    expect(lastFrame()).toContain('No orgs found');
  });
});
