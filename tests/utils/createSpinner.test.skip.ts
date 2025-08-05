import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSpinner } from '../../src/utils/helpers';

describe('createSpinner', () => {
  // Mock process.stdout.write
  const originalWrite = process.stdout.write;
  const mockWrite = vi.fn();
  
  // Mock console methods
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.stdout.write = mockWrite;
  });
  
  afterEach(() => {
    process.stdout.write = originalWrite;
  });
  
  it('should create a spinner and start it', () => {
    const spinner = createSpinner('Loading');
    
    // Should have called process.stdout.write to render the spinner
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('Loading'));
    
    // Should return a spinner object with all the expected methods
    expect(spinner).toHaveProperty('start');
    expect(spinner).toHaveProperty('stop');
    expect(spinner).toHaveProperty('succeed');
    expect(spinner).toHaveProperty('fail');
    expect(spinner).toHaveProperty('warn');
    expect(spinner).toHaveProperty('info');
  });
  
  it('should call stop and console.log when succeed is called', () => {
    const spinner = createSpinner('Loading');
    
    spinner.succeed('Success');
    
    // Should call console.log with a success message
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Success'));
  });
  
  it('should call stop and console.error when fail is called', () => {
    const spinner = createSpinner('Loading');
    
    spinner.fail('Failed');
    
    // Should call console.error with a failure message
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed'));
  });
  
  it('should call stop and console.warn when warn is called', () => {
    const spinner = createSpinner('Loading');
    
    spinner.warn('Warning');
    
    // Should call console.warn with a warning message
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Warning'));
  });
  
  it('should call stop and console.info when info is called', () => {
    const spinner = createSpinner('Loading');
    
    spinner.info('Info');
    
    // Should call console.info with an info message
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Info'));
  });
  
  it('should render different frames when render is called', () => {
    const spinner = createSpinner('Loading');
    
    // Reset the mock to clear initial render call
    mockWrite.mockReset();
    
    // Render two different frames
    spinner.render(0);
    const firstRender = mockWrite.mock.calls[0][0];
    
    spinner.render(1);
    const secondRender = mockWrite.mock.calls[1][0];
    
    // The rendered frames should be different
    expect(firstRender).not.toEqual(secondRender);
  });
  
  it('should return the spinner instance from methods', () => {
    const spinner = createSpinner('Loading');
    
    // Each method should return the spinner instance for chaining
    expect(spinner.start('New text')).toBe(spinner);
    expect(spinner.stop()).toBe(spinner);
    expect(spinner.succeed()).toBe(spinner);
    expect(spinner.fail()).toBe(spinner);
    expect(spinner.warn()).toBe(spinner);
    expect(spinner.info('Info')).toBe(spinner);
  });
  
  it('should update text property when start is called', () => {
    const spinner = createSpinner('Loading');
    
    // Update the text
    spinner.start('New Loading Text');
    
    // Text property should be updated
    expect(spinner.text).toBe('New Loading Text');
  });
});