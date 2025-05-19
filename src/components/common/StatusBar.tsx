import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';
import { execa } from 'execa';
import pkg from '../../../package.json';

interface StatusBarProps {
  width?: number;
}

interface StatusInfo {
  currentOrg?: string;
  defaultOrg?: string;
  devhubOrg?: string;
  version: string;
  time: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ width = process.stdout.columns || 100 }) => {
  const theme = useTheme();
  const [status, setStatus] = useState<StatusInfo>({
    currentOrg: undefined,
    defaultOrg: undefined,
    devhubOrg: undefined,
    version: pkg.version,
    time: new Date().toLocaleTimeString()
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        time: new Date().toLocaleTimeString()
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Salesforce org info on mount
  useEffect(() => {
    const fetchOrgInfo = async () => {
      try {
        // Get default org
        const { stdout: orgInfoJson } = await execa('sf', ['config', 'get', 'target-org', '--json']);
        const orgInfo = JSON.parse(orgInfoJson);
        const defaultOrg = orgInfo?.result?.[0]?.value;

        // Get default devhub
        const { stdout: devhubInfoJson } = await execa('sf', ['config', 'get', 'target-dev-hub', '--json']);
        const devhubInfo = JSON.parse(devhubInfoJson);
        const devhubOrg = devhubInfo?.result?.[0]?.value;

        setStatus(prev => ({
          ...prev,
          currentOrg: defaultOrg,
          defaultOrg,
          devhubOrg
        }));
      } catch (error) {
        // Silently fail - this is just a status bar
        console.error('Failed to get org info:', error);
      }
    };

    fetchOrgInfo();
  }, []);

  return (
    <Box 
      flexDirection="row" 
      width={width} 
      height={1}
      justifyContent="space-between"
      backgroundColor={theme.colors.primary}
      padding={0}
    >
      <Box>
        <Text backgroundColor={theme.colors.primary} color={theme.colors.textInverse}>
          {` SF TUI v${status.version} `}
        </Text>
        {status.defaultOrg && (
          <Text backgroundColor={theme.colors.secondary} color={theme.colors.textInverse}>
            {` Org: ${status.defaultOrg} `}
          </Text>
        )}
        {status.devhubOrg && (
          <Text backgroundColor={theme.colors.info} color={theme.colors.textInverse}>
            {` DevHub: ${status.devhubOrg} `}
          </Text>
        )}
      </Box>
      
      <Box>
        <Text backgroundColor={theme.colors.warning} color={theme.colors.textInverse}>
          {` ?: Help `}
        </Text>
        <Text backgroundColor={theme.colors.primary} color={theme.colors.textInverse}>
          {` ${status.time} `}
        </Text>
      </Box>
    </Box>
  );
};

export default StatusBar;