import { describe, it, expect, vi } from 'vitest';

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    appendFile: vi.fn(),
  },
}));

describe('Simple Logger Test', () => {
  it('should not crash on import', async () => {
    const { logger } = await import('../../src/utils/logger');
    expect(logger).toBeDefined();
  });
});
