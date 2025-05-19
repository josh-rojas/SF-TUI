import React, { useMemo } from 'react';
import { Box, Text, useFocus, useInput } from 'ink';
import { useTheme } from '../../themes';

type Tab = {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
};

type TabsProps = {
  /**
   * Array of tab objects with id and label
   */
  tabs: Tab[];
  
  /**
   * Currently active tab ID
   */
  activeTab: string;
  
  /**
   * Callback when a tab is selected
   */
  onTabChange: (tabId: string) => void;
  
  /**
   * Whether the tabs are focusable
   * @default true
   */
  focusable?: boolean;
  
  /**
   * Whether to show a border around the tabs
   * @default true
   */
  bordered?: boolean;
  
  /**
   * Additional styles for the tabs container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional props for the tabs container
   */
  boxProps?: React.ComponentProps<typeof Box>;
};

/**
 * A tabbed navigation component for the TUI
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  focusable = true,
  bordered = true,
  style = {},
  boxProps = {},
}) => {
  const theme = useTheme();
  const { isFocused } = useFocus({ 
    isActive: focusable, 
    autoFocus: false 
  });
  
  // Find the active tab index
  const activeIndex = useMemo(() => {
    return Math.max(0, tabs.findIndex(tab => tab.id === activeTab));
  }, [tabs, activeTab]);
  
  // Handle keyboard navigation
  useInput(
    (input, key) => {
      if (!focusable) return;
      
      if (key.leftArrow) {
        // Move to the previous tab
        const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        onTabChange(tabs[prevIndex].id);
      } else if (key.rightArrow) {
        // Move to the next tab
        const nextIndex = (activeIndex + 1) % tabs.length;
        onTabChange(tabs[nextIndex].id);
      } else if (key.return || key.space) {
        // Activate the focused tab
        onTabChange(tabs[activeIndex].id);
      } else if (key.tab) {
        // Handle tab key to cycle through tabs
        const direction = key.shift ? -1 : 1;
        const nextIndex = (activeIndex + direction + tabs.length) % tabs.length;
        onTabChange(tabs[nextIndex].id);
      }
    },
    { isActive: focusable }
  );
  
  // Calculate tab styles
  const getTabStyles = (tab: Tab, index: number) => {
    const isActive = tab.id === activeTab;
    const isFocusedTab = isFocused && index === activeIndex;
    
    const baseStyles: React.CSSProperties = {
      paddingLeft: 2,
      paddingRight: 2,
      paddingTop: 0,
      paddingBottom: 0,
      height: 3,
      justifyContent: 'center',
      alignItems: 'center',
      borderStyle: 'single',
      borderColor: isActive ? theme.colors.primary : theme.colors.border,
      borderTop: true,
      borderLeft: true,
      borderRight: true,
      borderBottom: !isActive,
      backgroundColor: isActive ? theme.colors.primary : theme.colors.background,
      marginRight: 1,
    };
    
    if (isFocusedTab) {
      baseStyles.borderStyle = 'round';
      baseStyles.borderColor = theme.colors.primary;
    }
    
    if (tab.disabled) {
      baseStyles.opacity = 0.5;
      baseStyles.borderColor = theme.colors.border;
      baseStyles.backgroundColor = theme.colors.backgroundHover;
    }
    
    return baseStyles;
  };
  
  // Calculate tab text styles
  const getTabTextStyles = (tab: Tab, index: number) => {
    const isActive = tab.id === activeTab;
    const isFocusedTab = isFocused && index === activeIndex;
    
    const baseStyles: React.CSSProperties = {
      color: isActive ? theme.colors.textInverse : theme.colors.text,
    };
    
    if (isFocusedTab) {
      baseStyles.underline = true;
      baseStyles.bold = true;
    }
    
    if (tab.disabled) {
      baseStyles.color = theme.colors.textMuted;
    }
    
    return baseStyles;
  };
  
  return (
    <Box 
      flexDirection="column"
      {...boxProps}
      style={{
        borderStyle: bordered ? 'single' : 'none',
        borderColor: theme.colors.border,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 0,
        paddingBottom: 0,
        ...style,
      }}
    >
      <Box flexDirection="row" marginBottom={0}>
        {tabs.map((tab, index) => (
          <Box
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            style={getTabStyles(tab, index)}
          >
            <Text {...getTabTextStyles(tab, index)}>
              {tab.icon && <Text>{tab.icon} </Text>}
              {tab.label}
            </Text>
          </Box>
        ))}
      </Box>
      
      {/* Active tab content */}
      <Box 
        borderStyle="single"
        borderColor={theme.colors.border}
        borderTop={false}
        padding={1}
      >
        {tabs.find(tab => tab.id === activeTab)?.content}
      </Box>
    </Box>
  );
};

export default Tabs;
