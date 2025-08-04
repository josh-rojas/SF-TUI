import { describe, it, expect } from 'vitest';
import { getTheme, baseTheme, darkTheme, highContrastTheme, salesforceTheme } from '../../src/themes';

describe('Themes', () => {
  it('should return the base theme by default', () => {
    expect(getTheme()).toEqual(baseTheme);
  });

  it('should return the correct theme by name', () => {
    expect(getTheme('dark')).toEqual(darkTheme);
    expect(getTheme('highContrast')).toEqual(highContrastTheme);
    expect(getTheme('salesforce')).toEqual(salesforceTheme);
  });

  it('should return the base theme for unknown theme names', () => {
    expect(getTheme('unknown-theme')).toEqual(baseTheme);
  });
});
