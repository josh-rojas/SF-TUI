import { renderHook, act } from '../renderWithInk';
import { useNodeSelection } from '../../src/hooks/useNodeSelection';
import { useInput } from 'ink';

const useInputMock = vi.fn();
vi.mock('ink', () => ({
  useInput: (fn: any) => useInputMock(fn),
}));

describe('useNodeSelection', () => {
  it('should call onSelect when the enter key is pressed', () => {
    const onSelect = vi.fn();
    const item = { id: 1, name: 'Test Item' };

    renderHook(() => useNodeSelection(true, onSelect, item));

    const inputHandler = useInputMock.mock.calls[0][0];

    act(() => {
      inputHandler('', { return: true });
    });

    expect(onSelect).toHaveBeenCalledWith(item);
  });
});
