import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { executeCommand, executeSfCommand, invalidateCommandCache, clearCommandCache } from '../../src/utils/commandExecutor';
import { cacheService } from '../../src/utils/cache';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// Mock cache service
vi.mock('../../src/utils/cache', () => ({
  cacheService: {
    generateKey: vi.fn().mockImplementation((command, args) => `${command}-${args.join('-')}`),
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('commandExecutor', () => {
  // Import actual execa after mocking
  const { execa } = await import('execa');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('executeCommand', () => {
    it('should execute a command and return the result', async () => {
      const result = {
        stdout: 'command output',
        stderr: '',
        exitCode: 0,
      };
      
      (execa as any).mockResolvedValue(result);
      (cacheService.get as any).mockReturnValue(null);
      
      const output = await executeCommand('test', ['arg1', 'arg2']);
      
      expect(execa).toHaveBeenCalledWith('test', ['arg1', 'arg2'], expect.anything());
      expect(output).toEqual({
        ...result,
        fromCache: false,
      });
    });
    
    it('should cache successful command results', async () => {
      const result = {
        stdout: 'command output',
        stderr: '',
        exitCode: 0,
      };
      
      (execa as any).mockResolvedValue(result);
      (cacheService.get as any).mockReturnValue(null);
      
      await executeCommand('test', ['arg1', 'arg2']);
      
      expect(cacheService.set).toHaveBeenCalledWith(
        'test-arg1-arg2',
        expect.objectContaining({
          stdout: 'command output',
          stderr: '',
          exitCode: 0,
          fromCache: false,
        })
      );
    });
    
    it('should return cached results when available', async () => {
      const cachedResult = {
        stdout: 'cached output',
        stderr: '',
        exitCode: 0,
      };
      
      (cacheService.get as any).mockReturnValue(cachedResult);
      
      const output = await executeCommand('test', ['arg1', 'arg2']);
      
      // Command should not be executed
      expect(execa).not.toHaveBeenCalled();
      
      // Result should come from cache
      expect(output).toEqual({
        ...cachedResult,
        fromCache: true,
      });
    });
    
    it('should skip cache for commands that modify state', async () => {
      const result = {
        stdout: 'command output',
        stderr: '',
        exitCode: 0,
      };
      
      (execa as any).mockResolvedValue(result);
      
      // Test with a modifying command
      await executeCommand('test', ['deploy', 'something']);
      
      // Cache should not be checked or set
      expect(cacheService.get).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
    
    it('should skip cache when cache option is disabled', async () => {
      const result = {
        stdout: 'command output',
        stderr: '',
        exitCode: 0,
      };
      
      (execa as any).mockResolvedValue(result);
      
      // Test with cache disabled
      await executeCommand('test', ['arg1', 'arg2'], { cache: false });
      
      // Cache should not be checked or set
      expect(cacheService.get).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
    
    it('should handle command errors', async () => {
      const errorResult = {
        stdout: '',
        stderr: 'command failed',
        exitCode: 1,
      };
      
      // Mock execa to reject with an error object
      (execa as any).mockRejectedValue({
        ...errorResult,
        message: 'Command failed with exit code 1',
      });
      
      const output = await executeCommand('test', ['arg1', 'arg2']);
      
      // Should still return a structured result
      expect(output).toEqual({
        ...errorResult,
        fromCache: false,
      });
      
      // Should not cache error results
      expect(cacheService.set).not.toHaveBeenCalled();
    });
    
    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      
      // Mock execa to reject with an unexpected error
      (execa as any).mockRejectedValue(unexpectedError);
      
      // Should throw the original error
      await expect(executeCommand('test', ['arg1', 'arg2'])).rejects.toThrow(unexpectedError);
    });
  });
  
  describe('executeSfCommand', () => {
    it('should execute an sf command', async () => {
      const result = {
        stdout: 'sf command output',
        stderr: '',
        exitCode: 0,
      };
      
      (execa as any).mockResolvedValue(result);
      (cacheService.get as any).mockReturnValue(null);
      
      const output = await executeSfCommand(['org', 'list']);
      
      expect(execa).toHaveBeenCalledWith('sf', ['org', 'list'], expect.anything());
      expect(output).toEqual({
        ...result,
        fromCache: false,
      });
    });
  });
  
  describe('cache management', () => {
    it('should invalidate command cache', () => {
      invalidateCommandCache('test', ['arg1', 'arg2']);
      
      expect(cacheService.generateKey).toHaveBeenCalledWith('test', ['arg1', 'arg2']);
      expect(cacheService.invalidate).toHaveBeenCalledWith('test-arg1-arg2');
    });
    
    it('should clear the entire command cache', () => {
      clearCommandCache();
      
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });
});