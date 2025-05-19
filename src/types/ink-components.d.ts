import React, { ReactNode } from 'react';

// Common prop types that all Ink components might need
declare global {
  interface CommonProps {
    style?: React.CSSProperties;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
  }
}

// Type definitions for ink-select-input
declare module 'ink-select-input' {
  export interface SelectInputItem<V = any> {
    label: string;
    value: V;
    [key: string]: any;
  }

  export interface Props {
    isSelected: boolean;
    label: string;
    [key: string]: any;
  }

  export interface SelectInputProps<V = any, T extends SelectInputItem<V> = SelectInputItem<V>> {
    items: T[];
    onSelect: (item: T) => void;
    onHighlight?: (item: T) => void;
    initialIndex?: number;
    indicatorComponent?: React.ReactNode;
    itemComponent?: React.FC<{
      isSelected: boolean;
      label: string;
      item?: T;
      description?: string;
      org?: any;
      plugin?: any;
      [key: string]: any;
    }>;
    limit?: number;
  }

  const SelectInput: React.FC<SelectInputProps>;
  export default SelectInput;
}

// Type definitions for ink components
declare module 'ink' {
  export interface BoxProps extends CommonProps {
    borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic' | 'none' | 'hidden';
    borderColor?: string;
    borderTop?: boolean | string;
    borderBottom?: boolean | string;
    borderLeft?: boolean | string;
    borderRight?: boolean | string;
    borderTopStyle?: string;
    borderBottomStyle?: string;
    borderLeftStyle?: string;
    borderRightStyle?: string;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    flex?: number | string;
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignSelf?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    padding?: number | string;
    paddingTop?: number | string;
    paddingBottom?: number | string;
    paddingLeft?: number | string;
    paddingRight?: number | string;
    paddingX?: number;
    paddingY?: number;
    margin?: number | string;
    marginTop?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    marginRight?: number | string;
    marginX?: number;
    marginY?: number;
    position?: 'absolute' | 'relative' | 'fixed';
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    backgroundColor?: string;
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    hoverStyle?: React.CSSProperties;
    gap?: number;
    columnGap?: number;
    rowGap?: number;
    tabIndex?: number;
    ref?: React.Ref<any>;
    children?: ReactNode;
  }

  export interface TextProps extends CommonProps {
    color?: string;
    backgroundColor?: string;
    dimColor?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    wrap?: 'wrap' | 'truncate' | 'truncate-start' | 'truncate-middle' | 'truncate-end' | boolean;
    className?: string;
    marginLeft?: number;
    marginRight?: number;
    onPress?: () => void;
    children?: ReactNode;
  }

  export interface AppProps {
    children: ReactNode;
    onExit?: () => void;
  }

  export const Box: React.FC<BoxProps>;
  export const Text: React.FC<TextProps>;
  export const useApp: () => { exit: (error?: Error) => void };
  export const useFocus: (options?: { autoFocus?: boolean, isActive?: boolean }) => { isFocused: boolean };
  export const useInput: (
    inputHandler: (input: string, key: {
      upArrow: boolean;
      downArrow: boolean;
      leftArrow: boolean;
      rightArrow: boolean;
      return: boolean;
      escape: boolean;
      ctrl: boolean;
      shift: boolean;
      tab: boolean;
      backspace: boolean;
      delete: boolean;
      meta: boolean;
    }) => void,
    options?: { isActive?: boolean }
  ) => void;
}

// Type definitions for ink-text-input
declare module 'ink-text-input' {
  export interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    focus?: boolean;
    mask?: string;
    highlightPastedText?: boolean;
    showCursor?: boolean;
    onSubmit?: (value: string) => void;
    children?: ReactNode;
  }

  const TextInput: React.FC<TextInputProps>;
  export default TextInput;
}

// Type definitions for ink-spinner
declare module 'ink-spinner' {
  export interface SpinnerProps {
    type?: string;
  }

  const Spinner: React.FC<SpinnerProps>;
  export default Spinner;
}

// Define Button component types
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger' | 'default' | 'text';

export interface ButtonProps extends CommonProps {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  active?: boolean;
  id?: string;
  accessKey?: string;
}

// Add key types with space key
declare module 'ink' {
  export interface KeyInput {
    upArrow: boolean;
    downArrow: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
    return: boolean;
    escape: boolean;
    ctrl: boolean;
    shift: boolean;
    tab: boolean;
    backspace: boolean;
    delete: boolean;
    meta: boolean;
    space?: boolean;
    alt?: boolean;
    name?: string;
  }
  
  export const useInput: (
    inputHandler: (input: string, key: KeyInput) => void,
    options?: { isActive?: boolean }
  ) => void;
}

// Extend ink-box for our custom version
declare module 'ink-box' {
  export interface BoxProps {
    borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
    borderColor?: string;
    backgroundColor?: string;
    float?: 'left' | 'right' | 'center';
    padding?: number | [number, number] | [number, number, number, number];
    margin?: number | [number, number] | [number, number, number, number];
    title?: string;
    width?: number | string;
    height?: number | string;
    dimBorder?: boolean;
    children?: ReactNode;
  }

  const Box: React.FC<BoxProps>;
  export default Box;
}