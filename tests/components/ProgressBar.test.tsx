import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProgressBar from '../../src/components/common/ProgressBar';
import { createInkMock } from '../testUtils';

// Mock useTheme
vi.mock('../../src/themes', () => ({
  useTheme: () => ({
    colors: {
      text: 'white',
      primary: 'blue',
      secondary: 'purple',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'cyan',
    }
  }),
}));

// Create Ink mocks
createInkMock();

describe('ProgressBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const { getByText } = render(
      <ProgressBar value={50} />
    );
    
    // Should show percentage by default
    expect(getByText('50.0%')).toBeDefined();
    
    // Should render the progress bar
    const progressBarElement = document.querySelector('span');
    expect(progressBarElement).toBeDefined();
  });

  it('calculates percentage correctly', () => {
    const { getByText } = render(
      <ProgressBar value={25} total={50} />
    );
    
    // 25/50 = 50%
    expect(getByText('50.0%')).toBeDefined();
  });

  it('clamps percentage between 0 and 100', () => {
    // Test value > total (>100%)
    const { getByText, rerender } = render(
      <ProgressBar value={150} total={100} />
    );
    
    // Should display 100% for values exceeding total
    expect(getByText('100.0%')).toBeDefined();
    
    // Test negative value (should show 0%)
    rerender(<ProgressBar value={-10} total={100} />);
    expect(getByText('0.0%')).toBeDefined();
  });

  it('respects custom width', () => {
    const { rerender } = render(
      <ProgressBar value={50} width={20} />
    );
    
    // First test with width=20
    const progressBarElement20 = document.querySelector('span');
    const progressBar20 = progressBarElement20?.textContent;
    
    rerender(<ProgressBar value={50} width={10} />);
    
    // Then test with width=10
    const progressBarElement10 = document.querySelector('span');
    const progressBar10 = progressBarElement10?.textContent;
    
    // Bar with width=20 should be longer than bar with width=10
    expect(progressBar20?.length).toBeGreaterThan(progressBar10?.length);
  });

  it('shows label when provided', () => {
    const { getByText } = render(
      <ProgressBar value={75} label="Loading" />
    );
    
    // Should show the label
    expect(getByText('Loading:')).toBeDefined();
  });

  it('shows value when showValue is true', () => {
    const { getByText } = render(
      <ProgressBar value={25} total={100} showValue={true} />
    );
    
    // Should show "25/100" value
    const valueElement = getByText('25/100');
    expect(valueElement).toBeDefined();
  });

  it('hides percentage when showPercentage is false', () => {
    const { queryByText } = render(
      <ProgressBar value={30} showPercentage={false} />
    );
    
    // Should not show percentage
    const percentageElement = queryByText('30.0%');
    expect(percentageElement).toBeNull();
  });

  it('uses custom filled and unfilled characters', () => {
    const { container } = render(
      <ProgressBar value={50} filledChar="X" unfilledChar="O" />
    );
    
    // Progress bar should include both X and O
    const progressBarText = container.textContent;
    expect(progressBarText).toContain('X');
    expect(progressBarText).toContain('O');
  });

  it('applies different variants', () => {
    const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'];
    
    for (const variant of variants) {
      const { getByText, unmount } = render(
        <ProgressBar value={50} variant={variant as any} />
      );
      
      // Should render the percentage with each variant
      expect(getByText('50.0%')).toBeDefined();
      
      unmount();
    }
  });

  it('applies custom styles', () => {
    const customStyle = {
      marginTop: 1,
      marginBottom: 1
    };
    
    render(
      <ProgressBar value={50} style={customStyle} />
    );
    
    // We're primarily testing that it renders without crashing
    // when custom styles are applied
    expect(document.querySelector('span')?.textContent).toBeDefined();
  });

  it('correctly calculates filled and unfilled portions', () => {
    // Test with 25% completion on a width of 20
    const { container, rerender } = render(
      <ProgressBar value={25} width={20} />
    );
    
    const progressBar25 = container.textContent?.replace(/\s+/g, '').replace('25.0%', '');
    
    // 25% of width 20 should have 5 filled characters
    const filledCount25 = (progressBar25?.match(/█/g) || []).length;
    expect(filledCount25).toBe(5);
    
    // Rerender with 75% completion
    rerender(<ProgressBar value={75} width={20} />);
    
    const progressBar75 = container.textContent?.replace(/\s+/g, '').replace('75.0%', '');
    
    // 75% of width 20 should have 15 filled characters
    const filledCount75 = (progressBar75?.match(/█/g) || []).length;
    expect(filledCount75).toBe(15);
  });
});