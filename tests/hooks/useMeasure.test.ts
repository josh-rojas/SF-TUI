import { renderHook } from '../renderWithInk';
import { useMeasure } from '../../src/hooks/useMeasure';

describe('useMeasure', () => {
  it('should return a ref and dimensions', () => {
    const { result } = renderHook(() => useMeasure());
    const [ref, dimensions] = result.current;

    expect(ref).toBeDefined();
    expect(dimensions).toBeDefined();
  });
});
