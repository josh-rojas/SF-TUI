import React, { useState, useRef, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';
import { useMeasure } from '../../hooks/useMeasure';

type CollapsibleProps = {
  /**
   * The content to display when expanded
   */
  children: React.ReactNode;
  
  /**
   * The title or trigger element that toggles the content
   */
  title: string | React.ReactNode;
  
  /**
   * Whether the content is initially expanded
   * @default false
   */
  defaultExpanded?: boolean;
  
  /**
   * Whether the component is controlled externally
   * @default false
   */
  isExpanded?: boolean;
  
  /**
   * Callback when the expanded state changes
   */
  onToggle?: (isExpanded: boolean) => void;
  
  /**
   * The character to show when collapsed
   * @default '▶'
   */
  collapsedIcon?: string;
  
  /**
   * The character to show when expanded
   * @default '▼'
   */
  expandedIcon?: string;
  
  /**
   * Additional styles for the container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional styles for the header
   */
  headerStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the content
   */
  contentStyle?: React.CSSProperties;
  
  /**
   * Whether to show a border around the collapsible
   * @default false
   */
  bordered?: boolean;
};

/**
 * A collapsible component that can show/hide content with a smooth animation
 */
const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  title,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
  collapsedIcon = '▶',
  expandedIcon = '▼',
  style = {},
  headerStyle = {},
  contentStyle = {},
  bordered = false,
}) => {
  const theme = useTheme();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Determine if we're in controlled mode
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;
  
  // Measure the content height when it changes
  const [_, dimensions] = useMeasure(contentRef);
  const measuredHeight = dimensions?.height || 0;
  
  // Update content height when children change
  useEffect(() => {
    if (measuredHeight > 0) {
      setContentHeight(expanded ? measuredHeight : 0);
    }
  }, [expanded, measuredHeight]);
  
  // Handle toggle
  const handleToggle = () => {
    const newExpanded = !expanded;
    
    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }
    
    if (onToggle) {
      onToggle(newExpanded);
    }
  };
  
  // Render the header
  const renderHeader = () => {
    const icon = expanded ? expandedIcon : collapsedIcon;
    
    return (
      <Box
        flexDirection="row"
        alignItems="center"
        onClick={handleToggle}
        style={{
          cursor: 'pointer',
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 0.5,
          paddingBottom: 0.5,
          ...headerStyle,
        }}
      >
        <Text color={theme.colors.text}>
          {` ${icon} `}
        </Text>
        {typeof title === 'string' ? (
          <Text>{title}</Text>
        ) : (
          title
        )}
      </Box>
    );
  };
  
  // Render the content
  const renderContent = () => {
    return (
      <Box
        ref={contentRef}
        style={{
          overflow: 'hidden',
          height: contentHeight,
          transition: 'height 0.2s ease-in-out',
          ...contentStyle,
        }}
      >
        <Box>
          {children}
        </Box>
      </Box>
    );
  };
  
  return (
    <Box
      flexDirection="column"
      borderStyle={bordered ? 'single' : undefined}
      borderColor={theme.colors.border}
      style={style}
    >
      {renderHeader()}
      {renderContent()}
    </Box>
  );
};

// Named export 
export { Collapsible };
// Default export
export default Collapsible;
