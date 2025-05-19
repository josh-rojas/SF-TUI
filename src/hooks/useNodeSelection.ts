import { useInput } from 'ink';
import { useCallback, useRef } from 'react';

/**
 * Custom hook to handle node selection in tree views and similar components
 * Since Ink doesn't support onClick directly, we use useInput to simulate selection
 */
export const useNodeSelection = <T>(
  isFocused: boolean,
  onSelect: (item: T) => void,
  item: T
) => {
  // Track if this node is the currently focused one
  const nodeRef = useRef({ isFocused });

  // Update the ref when focus changes
  nodeRef.current.isFocused = isFocused;

  // Set up input handler
  useInput(
    useCallback(
      (input, key) => {
        // Only handle enter key presses for the focused node
        if (nodeRef.current.isFocused && key.return) {
          onSelect(item);
          return true;
        }
        return false;
      },
      [item, onSelect]
    ),
    { isActive: isFocused }
  );

  return {
    // Return any properties or handlers needed
    ref: nodeRef,
  };
};