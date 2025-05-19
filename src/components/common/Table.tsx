import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';
import { BorderBox } from './Box';

type ColumnDefinition<T> = {
  /**
   * Unique key for the column
   */
  key: string;
  
  /**
   * Header label for the column
   */
  header: string;
  
  /**
   * Function to render the cell content
   */
  render: (item: T) => React.ReactNode;
  
  /**
   * Width of the column (in characters or percentage)
   * @default 'auto'
   */
  width?: number | string;
  
  /**
   * Whether the column should be right-aligned
   * @default false
   */
  alignRight?: boolean;
  
  /**
   * Whether the column should be truncated with an ellipsis if content is too long
   * @default false
   */
  truncate?: boolean;
};

type TableProps<T> = {
  /**
   * Array of data items to display in the table
   */
  data: T[];
  
  /**
   * Column definitions for the table
   */
  columns: ColumnDefinition<T>[];
  
  /**
   * Key to use for each row (should be unique)
   */
  rowKey: keyof T | ((item: T) => string | number);
  
  /**
   * Whether to show the header row
   * @default true
   */
  showHeader?: boolean;
  
  /**
   * Whether to show borders around the table
   * @default true
   */
  bordered?: boolean;
  
  /**
   * Whether to add zebra striping to rows
   * @default true
   */
  striped?: boolean;
  
  /**
   * Whether to highlight rows on hover
   * @default false
   */
  highlightHover?: boolean;
  
  /**
   * Additional styles for the table container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional styles for the header row
   */
  headerStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the table rows
   */
  rowStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the table cells
   */
  cellStyle?: React.CSSProperties;
};

/**
 * A table component for displaying tabular data in the TUI
 */
function Table<T>({
  data,
  columns,
  rowKey,
  showHeader = true,
  bordered = true,
  striped = true,
  highlightHover = false,
  style = {},
  headerStyle = {},
  rowStyle = {},
  cellStyle = {},
}: TableProps<T>) {
  const theme = useTheme();
  
  // Get the row key from the item
  const getRowKey = (item: T): string => {
    if (typeof rowKey === 'function') {
      return String(rowKey(item));
    }
    return String(item[rowKey as keyof T]);
  };
  
  // Calculate column widths
  const columnWidths = columns.map(col => {
    if (col.width) return col.width;
    return 'auto';
  });
  
  // Render the header row
  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <Box 
        flexDirection="row"
        borderStyle={bordered ? 'single' : undefined}
        borderBottom={bordered}
        borderColor={theme.colors.border}
        paddingX={bordered ? 1 : 0}
        paddingY={bordered ? 0.5 : 0}
        style={{
          backgroundColor: theme.colors.backgroundHover,
          ...headerStyle,
        }}
      >
        {columns.map((col, colIndex) => (
          <Box
            key={col.key}
            width={columnWidths[colIndex]}
            justifyContent={col.alignRight ? 'flex-end' : 'flex-start'}
            paddingX={1}
          >
            <Text bold>{col.header}</Text>
          </Box>
        ))}
      </Box>
    );
  };
  
  // Render a single row
  const renderRow = (item: T, rowIndex: number) => {
    const key = getRowKey(item);
    const isEvenRow = rowIndex % 2 === 0;
    
    return (
      <Box
        key={key}
        flexDirection="row"
        borderStyle={bordered && rowIndex < data.length - 1 ? 'single' : undefined}
        borderBottom={bordered && rowIndex === data.length - 1 ? 'single' : undefined}
        borderColor={theme.colors.border}
        paddingX={bordered ? 1 : 0}
        paddingY={0.5}
        style={{
          backgroundColor: striped && isEvenRow ? theme.colors.backgroundHover : 'transparent',
          ...rowStyle,
        }}
        hoverStyle={highlightHover ? { backgroundColor: theme.colors.primaryMuted } : undefined}
      >
        {columns.map((col, colIndex) => (
          <Box
            key={`${key}-${col.key}`}
            width={columnWidths[colIndex]}
            justifyContent={col.alignRight ? 'flex-end' : 'flex-start'}
            paddingX={1}
            style={cellStyle}
          >
            {col.truncate ? (
              <Text>{String(col.render(item))}</Text>
            ) : (
              <Text>{col.render(item)}</Text>
            )}
          </Box>
        ))}
      </Box>
    );
  };
  
  return (
    <BorderBox 
      borderStyle={bordered ? 'single' : 'hidden'}
      borderColor={theme.colors.border}
      style={style}
    >
      {renderHeader()}
      <Box flexDirection="column">
        {data.map((item, index) => renderRow(item, index))}
      </Box>
    </BorderBox>
  );
}

export default Table;
