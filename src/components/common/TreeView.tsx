import React, { useState, useCallback } from 'react';
import { Box, Text, useFocus } from 'ink';
import { useTheme } from '../../themes';
import { Collapsible } from './Collapsible';

type TreeNode = {
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

type TreeViewProps = {
  /**
   * The tree data to display
   */
  data: TreeNode[];
  
  /**
   * Callback when a node is selected
   */
  onSelect?: (node: TreeNode) => void;
  
  /**
   * Callback when a node is toggled (expanded/collapsed)
   */
  onToggle?: (node: TreeNode, isExpanded: boolean) => void;
  
  /**
   * The currently selected node ID
   */
  selectedId?: string | null;
  
  /**
   * The depth of the current level (used internally for indentation)
   * @internal
   */
  depth?: number;
  
  /**
   * Additional styles for the tree container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional styles for the node container
   */
  nodeStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the node label
   */
  labelStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the selected node
   */
  selectedStyle?: React.CSSProperties;
};

/**
 * A recursive tree view component for displaying hierarchical data
 */
const TreeView: React.FC<TreeViewProps> = ({
  data,
  onSelect,
  onToggle,
  selectedId,
  depth = 0,
  style = {},
  nodeStyle = {},
  labelStyle = {},
  selectedStyle = {},
}) => {
  const theme = useTheme();
  
  // Handle node selection
  const handleSelect = useCallback((node: TreeNode) => {
    if (node.selectable !== false && onSelect) {
      onSelect(node);
    }
  }, [onSelect]);
  
  // Handle node toggle (expand/collapse)
  const handleToggle = useCallback((node: TreeNode, isExpanded: boolean) => {
    if (onToggle) {
      onToggle(node, isExpanded);
    }
  }, [onToggle]);
  
  // Render a single tree node
  const renderNode = (node: TreeNode, index: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;
    const indent = depth * 2;
    
    // Default styles
    const defaultNodeStyle: React.CSSProperties = {
      marginLeft: indent,
      paddingLeft: 1,
      paddingRight: 1,
      ...(node.selectable !== false ? {} : { opacity: 0.7 }),
      ...nodeStyle,
    };
    
    const defaultLabelStyle: React.CSSProperties = {
      color: isSelected ? theme.colors.primary : theme.colors.text,
      ...labelStyle,
    };
    
    const selectedNodeStyle: React.CSSProperties = isSelected ? {
      backgroundColor: theme.colors.primaryBackground,
      ...selectedStyle,
    } : {};
    
    // Make a leaf node (no children) selectable with keyboard
    const handleLeafSelect = () => {
      if (node.selectable !== false && onSelect) {
        onSelect(node);
      }
    };
    
    // Render a leaf node (no children)
    if (!hasChildren) {
      return (
        <Box 
          key={node.id || index}
          borderStyle="none"
          style={{
            ...defaultNodeStyle,
            ...selectedNodeStyle,
          }}
        >
          <Text 
            style={defaultLabelStyle}
            // Use Ink's native focus handling instead of onClick
            dimColor={!isSelected}
          >
            {node.icon && <Text>{node.icon} </Text>}
            <Text>{node.label}</Text>
            {/* Add an invisible character for focusing that triggers selection */}
            {node.selectable !== false && (
              <Text
                color="transparent"
                dimColor
                onFocus={() => isSelected || handleSelect(node)}
              >
                •
              </Text>
            )}
          </Text>
        </Box>
      );
    }
    
    // Render a parent node with children
    return (
      <Collapsible
        key={node.id || index}
        title={
          <Text style={defaultLabelStyle}>
            {node.icon && <Text>{node.icon} </Text>}
            {node.label}
          </Text>
        }
        defaultExpanded={node.isExpanded}
        onToggle={(isExpanded) => handleToggle(node, isExpanded)}
        headerStyle={{
          ...defaultNodeStyle,
          ...(isSelected ? selectedNodeStyle : {}),
          paddingLeft: 0,
        }}
        contentStyle={{
          paddingLeft: 0,
        }}
      >
        <TreeView
          data={node.children || []}
          onSelect={onSelect}
          onToggle={onToggle}
          selectedId={selectedId}
          depth={depth + 1}
          style={style}
          nodeStyle={nodeStyle}
          labelStyle={labelStyle}
          selectedStyle={selectedStyle}
        />
      </Collapsible>
    );
  };
  
  return (
    <Box flexDirection="column" style={style}>
      {data.map((node, index) => renderNode(node, index))}
    </Box>
  );
};

export { TreeView };
export type { TreeNode, TreeViewProps };
