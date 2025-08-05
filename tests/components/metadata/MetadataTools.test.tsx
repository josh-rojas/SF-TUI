import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import MetadataTools from '../../../src/components/metadata/MetadataTools';
import { execa } from 'execa';

vi.mock('execa', () => ({ execa: vi.fn() }));
const mockExeca = execa as unknown as vi.Mock;

vi.mock('ink-select-input', () => ({ default: () => null }));
vi.mock('ink-spinner', () => ({ default: () => null }));
vi.mock('../../../src/utils', () => ({ errorReporter: { reportError: vi.fn() }, ErrorCategory: {}, ErrorSeverity: {} }));

describe('MetadataTools', () => {
  it('renders tool list', async () => {
    mockExeca.mockResolvedValueOnce({ stdout: JSON.stringify({ status: 0, result: { nonScratchOrgs: [], scratchOrgs: [] } }) });
    const { lastFrame } = render(<MetadataTools onBack={() => {}} />);
    await new Promise(r => setTimeout(r, 0));
    const output = lastFrame();
    expect(output).toContain('Metadata Tools');
  });
});
