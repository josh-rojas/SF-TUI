import React, { useState, useEffect, useCallback } from 'react';
import { Text, useInput, Box } from 'ink';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  focus?: boolean;
  mask?: string;
  showCursor?: boolean;
  highlightPastedText?: boolean;
  validate?: (value: string) => boolean | string;
  width?: number;
  multiline?: boolean;
};

export const TextInput = ({
  value: originalValue,
  onChange,
  placeholder = '',
  onSubmit,
  focus: customFocus = true,
  mask,
  showCursor = true,
  validate,
  width,
  multiline = false,
}: Props) => {
  const [cursorOffset, setCursorOffset] = useState(originalValue.length);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [focus, setFocus] = useState(customFocus);
  const [temporaryValue, setTemporaryValue] = useState(originalValue);
  
  // Handle external value changes
  useEffect(() => {
    setTemporaryValue(originalValue);
    setCursorOffset(originalValue.length);
  }, [originalValue]);
  
  // Handle validation
  useEffect(() => {
    if (validate) {
      const validationResult = validate(temporaryValue);
      if (validationResult === false) {
        setValidationError('Invalid input');
      } else if (typeof validationResult === 'string') {
        setValidationError(validationResult);
      } else {
        setValidationError(null);
      }
    }
  }, [temporaryValue, validate]);
  
  // Handle cursor position
  const handleInput = useCallback((input: string, key: any) => {
    if (key.upArrow || key.downArrow || (key.ctrl && input === 'c') || key.escape) {
      return;
    }
    
    let newValue = temporaryValue;
    let newCursorOffset = cursorOffset;
    
    if (key.return) {
      if (onSubmit && (!validate || !validationError)) {
        onSubmit(temporaryValue);
      }
      return;
    }
    
    if (key.leftArrow) {
      if (key.ctrl) {
        // Move to the beginning of the previous word
        const words = temporaryValue.split(/\s+/);
        let currentPos = 0;
        for (let i = 0; i < words.length; i++) {
          if (currentPos + words[i].length >= cursorOffset) {
            if (i > 0) {
              newCursorOffset = temporaryValue.indexOf(words[i - 1]);
            } else {
              newCursorOffset = 0;
            }
            break;
          }
          currentPos += words[i].length + 1; // +1 for the space
        }
      } else {
        newCursorOffset = Math.max(0, cursorOffset - 1);
      }
    } else if (key.rightArrow) {
      if (key.ctrl) {
        // Move to the beginning of the next word
        const words = temporaryValue.split(/\s+/);
        let currentPos = 0;
        for (let i = 0; i < words.length; i++) {
          currentPos += words[i].length;
          if (currentPos > cursorOffset) {
            newCursorOffset = Math.min(temporaryValue.length, currentPos + 1);
            break;
          }
          currentPos += 1; // for the space
        }
      } else {
        newCursorOffset = Math.min(temporaryValue.length, cursorOffset + 1);
      }
    } else if (key.delete) {
      // Delete forward
      newValue = 
        temporaryValue.slice(0, cursorOffset) + 
        temporaryValue.slice(cursorOffset + 1);
    } else if (key.backspace || key.delete) {
      // Delete backward
      if (cursorOffset > 0) {
        newValue = 
          temporaryValue.slice(0, cursorOffset - 1) + 
          temporaryValue.slice(cursorOffset);
        newCursorOffset = cursorOffset - 1;
      }
    } else if (key.home) {
      newCursorOffset = 0;
    } else if (key.end) {
      newCursorOffset = temporaryValue.length;
    } else if (
      input.length > 0 &&
      !key.ctrl &&
      !key.meta &&
      !key.alt
    ) {
      // Insert text at cursor position
      newValue = 
        temporaryValue.slice(0, cursorOffset) + 
        input + 
        temporaryValue.slice(cursorOffset);
      newCursorOffset = cursorOffset + input.length;
    }
    
    if (newValue !== temporaryValue) {
      setTemporaryValue(newValue);
      onChange(newValue);
    }
    
    if (newCursorOffset !== cursorOffset) {
      setCursorOffset(newCursorOffset);
    }
  }, [temporaryValue, cursorOffset, onChange, onSubmit, validate, validationError]);
  
  useInput(handleInput, { isActive: focus });
  
  // Handle focus changes
  useEffect(() => {
    setFocus(customFocus);
  }, [customFocus]);
  
  // Calculate cursor position and visible text
  const displayValue = mask ? mask.repeat(temporaryValue.length) : temporaryValue;
  const cursorChar = '█';
  
  // Split the value into before and after the cursor
  const beforeCursor = displayValue.slice(0, cursorOffset);
  const afterCursor = displayValue.slice(cursorOffset);
  
  // Calculate the visible part of the input if width is constrained
  let visibleBeforeCursor = beforeCursor;
  let visibleAfterCursor = afterCursor;
  
  if (width) {
    const maxVisible = Math.max(0, width - 1); // Leave space for cursor
    
    if (beforeCursor.length > maxVisible) {
      visibleBeforeCursor = '…' + beforeCursor.slice(-maxVisible + 1);
    }
    
    if (afterCursor.length + visibleBeforeCursor.length > maxVisible) {
      const remainingSpace = Math.max(0, maxVisible - visibleBeforeCursor.length - 1);
      visibleAfterCursor = afterCursor.slice(0, remainingSpace) + (afterCursor.length > remainingSpace ? '…' : '');
    }
  }
  
  // Render the input field with cursor
  return (
    <Box flexDirection="column">
      <Box>
        <Text>{visibleBeforeCursor}</Text>
        {focus && showCursor && (
          <Text inverse>{cursorChar || ' '}</Text>
        )}
        <Text>{visibleAfterCursor || (focus && showCursor ? ' ' : '')}</Text>
        {!visibleBeforeCursor && !visibleAfterCursor && !focus && (
          <Text dimColor>{placeholder}</Text>
        )}
      </Box>
      {validationError && (
        <Text color="red">{validationError}</Text>
      )}
    </Box>
  );
};

export default TextInput;
