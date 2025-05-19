import React, { createContext, useContext, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { useTheme } from '../themes';
import { CustomBox } from '../components/common/Box';

export interface HelpTopic {
  id: string;
  title: string;
  content: string | React.ReactNode;
  keywords: string[];
  relatedTopics?: string[];
}

interface HelpContextType {
  showHelp: boolean;
  toggleHelp: () => void;
  currentTopic: string | null;
  setCurrentTopic: (topicId: string | null) => void;
  topics: HelpTopic[];
  registerTopic: (topic: HelpTopic) => void;
  unregisterTopic: (topicId: string) => void;
  contextualHelp: HelpTopic[];
  setContextualHelp: (topicIds: string[]) => void;
}

const HelpContext = createContext<HelpContextType>({
  showHelp: false,
  toggleHelp: () => {},
  currentTopic: null,
  setCurrentTopic: () => {},
  topics: [],
  registerTopic: () => {},
  unregisterTopic: () => {},
  contextualHelp: [],
  setContextualHelp: () => {},
});

// Predefined help topics
const defaultTopics: HelpTopic[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    content: 
      <Box flexDirection="column">
        <Text>Navigate through the application using these keys:</Text>
        <Text>• Arrow keys: Move through menus and lists</Text>
        <Text>• Enter: Select an item or confirm an action</Text>
        <Text>• Esc: Go back to the previous screen</Text>
        <Text>• Ctrl+Q: Quit the application</Text>
      </Box>,
    keywords: ['navigate', 'navigation', 'menu', 'arrow', 'keys', 'back'],
    relatedTopics: ['shortcuts']
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    content: 
      <Box flexDirection="column">
        <Text>Common keyboard shortcuts:</Text>
        <Text>• ?: Show help</Text>
        <Text>• Ctrl+Q: Quit application</Text>
        <Text>• Ctrl+S: Toggle status bar</Text>
        <Text>• Ctrl+T: Cycle through themes</Text>
        <Text>• Ctrl+R: Refresh current view</Text>
      </Box>,
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'keys'],
    relatedTopics: ['navigation']
  },
  {
    id: 'orgs',
    title: 'Managing Salesforce Orgs',
    content: 
      <Box flexDirection="column">
        <Text>Working with Salesforce orgs:</Text>
        <Text>• View a list of connected orgs in Org Manager</Text>
        <Text>• Set default org or DevHub with the "Set as Default" option</Text>
        <Text>• Open an org in browser with the "Open Org" option</Text>
        <Text>• Log out of an org with the "Delete Org" option</Text>
      </Box>,
    keywords: ['org', 'orgs', 'salesforce', 'devhub', 'login', 'logout'],
  },
  {
    id: 'metadata',
    title: 'Working with Metadata',
    content:
      <Box flexDirection="column">
        <Text>Managing Salesforce metadata:</Text>
        <Text>• Deploy metadata to an org with the "Deploy" option</Text>
        <Text>• Retrieve metadata from an org with the "Retrieve" option</Text>
        <Text>• Compare metadata with the "Compare" option</Text>
      </Box>,
    keywords: ['metadata', 'deploy', 'retrieve', 'compare'],
  },
  {
    id: 'themes',
    title: 'Themes',
    content:
      <Box flexDirection="column">
        <Text>Customizing the application appearance:</Text>
        <Text>• Select a theme in the Settings menu</Text>
        <Text>• Cycle through themes with Ctrl+T</Text>
        <Text>• Available themes: Base, Dark, High Contrast, Salesforce</Text>
      </Box>,
    keywords: ['theme', 'themes', 'appearance', 'colors', 'dark', 'light'],
  },
];

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<HelpTopic[]>(defaultTopics);
  const [contextualHelp, setContextualHelp] = useState<HelpTopic[]>([]);
  
  const toggleHelp = () => {
    setShowHelp(prev => !prev);
    if (showHelp) {
      setCurrentTopic(null);
    }
  };
  
  const registerTopic = (topic: HelpTopic) => {
    setTopics(prev => {
      // Replace if exists, otherwise add
      const exists = prev.some(t => t.id === topic.id);
      if (exists) {
        return prev.map(t => t.id === topic.id ? topic : t);
      } else {
        return [...prev, topic];
      }
    });
  };
  
  const unregisterTopic = (topicId: string) => {
    setTopics(prev => prev.filter(t => t.id !== topicId));
  };
  
  const updateContextualHelp = (topicIds: string[]) => {
    const relevantTopics = topics.filter(t => topicIds.includes(t.id));
    setContextualHelp(relevantTopics);
  };
  
  // Handle ? key for help
  useInput((input, key) => {
    if (input === '?') {
      toggleHelp();
    } else if (key.escape && showHelp) {
      if (currentTopic) {
        setCurrentTopic(null);
      } else {
        setShowHelp(false);
      }
    }
  });
  
  const contextValue = {
    showHelp,
    toggleHelp,
    currentTopic,
    setCurrentTopic,
    topics,
    registerTopic,
    unregisterTopic,
    contextualHelp,
    setContextualHelp: updateContextualHelp,
  };
  
  return (
    <HelpContext.Provider value={contextValue}>
      {children}
    </HelpContext.Provider>
  );
};

// Hook to use the help context
export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

// Contextual help component
export const ContextualHelp: React.FC = () => {
  const theme = useTheme();
  const { showHelp, toggleHelp, currentTopic, setCurrentTopic, topics, contextualHelp } = useHelp();
  
  if (!showHelp) return null;
  
  const allTopics = [...contextualHelp, ...topics.filter(t => !contextualHelp.some(ct => ct.id === t.id))];
  
  if (currentTopic) {
    const topic = topics.find(t => t.id === currentTopic);
    if (!topic) return null;
    
    return (
      <CustomBox
        title={topic.title}
        borderStyle="round"
        borderColor={theme.colors.primary}
        padding={1}
      >
        <Box flexDirection="column">
          <Box marginBottom={1}>{topic.content}</Box>
          
          {topic.relatedTopics && topic.relatedTopics.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>Related Topics:</Text>
              <Box>
                {topic.relatedTopics.map((topicId, index) => {
                  const relatedTopic = topics.find(t => t.id === topicId);
                  if (!relatedTopic) return null;
                  
                  return (
                    <Box key={topicId} marginRight={1}>
                      <Text
                        color={theme.colors.primary}
                        underline
                        onPress={() => setCurrentTopic(topicId)}
                      >
                        {relatedTopic.title}
                      </Text>
                      {index < topic.relatedTopics!.length - 1 && <Text>, </Text>}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
          
          <Box marginTop={1}>
            <Text color="gray" italic>Press ESC to go back</Text>
          </Box>
        </Box>
      </CustomBox>
    );
  }
  
  return (
    <CustomBox
      title="Help Topics"
      borderStyle="round"
      borderColor={theme.colors.primary}
      padding={1}
    >
      <Box flexDirection="column">
        {contextualHelp.length > 0 && (
          <>
            <Text bold>Contextual Help</Text>
            <Box flexDirection="column" marginY={1}>
              {contextualHelp.map(topic => (
                <Box key={topic.id} marginBottom={0.5}>
                  <Text
                    color={theme.colors.primary}
                    underline
                    onPress={() => setCurrentTopic(topic.id)}
                  >
                    {topic.title}
                  </Text>
                </Box>
              ))}
            </Box>
          </>
        )}
        
        <Text bold>All Topics</Text>
        <Box flexDirection="column" marginY={1}>
          {allTopics.map(topic => (
            <Box key={topic.id} marginBottom={0.5}>
              <Text
                color={theme.colors.primary}
                underline
                onPress={() => setCurrentTopic(topic.id)}
              >
                {topic.title}
              </Text>
            </Box>
          ))}
        </Box>
        
        <Box marginTop={1}>
          <Text color="gray" italic>Press ESC to close help</Text>
        </Box>
      </Box>
    </CustomBox>
  );
};

export default HelpContext;