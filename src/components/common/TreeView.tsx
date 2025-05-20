import React, { useState, useCallback } from 'react';
import { Box, BoxProps, Text } from 'ink';
import { useTheme } from '../../themes';
import { Collapsible } from './Collapsible';

// Extend BoxProps to include ARIA attributes
interface AccessibleBoxProps extends BoxProps {
  role?: string;
  'aria-selected'?: boolean;
  'data-testid'?: string;
  'data-selected'?: boolean;
}

// Define TreeNode interface
interface TreeNode {
  /**
   * The unique identifier for the node
   */
  id: string;
  
  /**
   * The display label for the node
   */
  label: string;
  
  /**
   * Optional icon to display before the label
   */
  icon?: string;
  
  /**
   * Whether the node is expanded by default
   * @default false
   */
  isExpanded?: boolean;
  
  /**
   * Child nodes (for nested structures)
   */
  children?: TreeNode[];
  
  /**
   * Additional data associated with the node
   */
  data?: Record<string, any>;
  
  /**
   * Whether the node is selectable
   * @default true
   */
  selectable?: boolean;
  
  /**
   * Whether the node is currently selected
   * @default false
   */
  isSelected?: boolean;
};

// Define TreeViewProps interface
interface TreeViewProps {
  /**
   * The tree data to display
   */
  data: TreeNode[];
  
  /**
   * Callback when a node is selected
   */
  onSelect: (node: TreeNode) => void;
  
  /**
   * Callback when a node is expanded/collapsed
   */
  onToggle: (node: TreeNode, isExpanded: boolean) => void;
  
  /**
   * The ID of the currently selected node
   */
  selectedId?: string | null;
  
  /**
   * The depth of the current level in the tree (used internally for recursion)
   * @default 0
   */
  depth?: number;
  
  /**
   * Additional styles for the tree container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional styles for each node
   */
  nodeStyle?: React.CSSProperties;
  
  /**
   * Additional styles for node labels
   */
  labelStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the selected node
   */
  selectedStyle?: React.CSSProperties;
}

/**
 * A recursive tree view component for displaying hierarchical data
 */
const TreeView: React.FC<TreeViewProps> = ({
  data,
  onSelect,
  onToggle,
  selectedId = null,
  depth = 0,
  style = {},
  nodeStyle: nodeStyleProp = {},
  labelStyle: labelStyleProp = {},
  selectedStyle = { backgroundColor: 'yellow' },
}) => {
  const theme = useTheme();
  
  // Handle node selection
  const handleSelect = useCallback((node: TreeNode) => {
    if (node.selectable !== false) {
      onSelect(node);
    }
  }, [onSelect]);
  
  // Handle node toggle (expand/collapse)
  const handleToggle = useCallback((node: TreeNode, isExpanded: boolean) => {
    onToggle(node, isExpanded);
  }, [onToggle]);
  
  // Render a single tree node
  const renderNode = (node: TreeNode, index: number): React.ReactNode => {
    const isSelected = node.id === selectedId;
    const hasChildren = node.children && node.children.length > 0;
    
    // Default styles
    const defaultNodeStyle: React.CSSProperties = {
      marginLeft: depth * 2,
      paddingLeft: 1,
      paddingRight: 1,
      ...(node.selectable !== false ? {} : { opacity: 0.7 }),
    };
    
    const defaultLabelStyle: React.CSSProperties = {
      color: isSelected ? theme.colors.primary : theme.colors.text,
    };
    
    const selectedNodeStyle: React.CSSProperties = isSelected ? {
      backgroundColor: theme.colors.primaryBackground,
      ...selectedStyle,
    } : {};
    
    const nodeStyle = {
      ...defaultNodeStyle,
      ...(isSelected ? selectedNodeStyle : {}),
      ...nodeStyleProp,
      ...(isSelected && selectedStyle ? selectedStyle : {}),
    };

    const labelStyle = {
      ...defaultLabelStyle,
      ...labelStyleProp,
    };

    // If the node has children, render it as a collapsible
    if (hasChildren) {
      return (
        <Collapsible
          key={node.id || index}
          title={
            <Text style={labelStyle}>
              {node.icon && <Text>{node.icon} </Text>}
              {node.label}
            </Text>
          }
          defaultExpanded={node.isExpanded ?? false}
          onToggle={(isExpanded) => handleToggle(node, isExpanded)}
          headerStyle={{
            ...nodeStyle,
            paddingLeft: 0,
          }}
          contentStyle={{
            paddingLeft: 0,
          }}
          data-testid={`collapsible-${node.id}`}
        >
          <TreeView
            data={node.children || []}
            onSelect={onSelect}
            onToggle={onToggle}
            selectedId={selectedId}
            depth={depth + 1}
            style={style}
            nodeStyle={nodeStyleProp}
            labelStyle={labelStyleProp}
            selectedStyle={selectedStyle}
          />
        </Collapsible>
      );
    }

    // Render a leaf node
    return (
      <Box 
        key={node.id || index}
        borderStyle="none"
        style={nodeStyle}
        {...{
          'role': 'treeitem',
          'aria-selected': isSelected,
          'data-testid': `tree-item-${node.id}`,
          'data-selected': isSelected
        } as AccessibleBoxProps}
      >
        <Text 
          style={labelStyle}
          onClick={() => handleSelect(node)}
        >
          {node.icon && <Text>{node.icon} </Text>}
          {node.label}
        </Text>
      </Box>
    );
  };

  return (
    <Box 
      flexDirection="column" 
      style={style}
      {...{
        'role': 'tree',
        'data-testid': 'tree-view'
      } as AccessibleBoxProps}
    >
      {data.map((node, index) => renderNode(node, index))}
    </Box>
  );
};

export { TreeView };
export type { TreeNode, TreeViewProps };
