import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { execa, ExecaChildProcess } from 'execa';
import Spinner from 'ink-spinner';
import { ErrorBoundary, useErrors, EnhancedProgressBar } from '../common';
import { errorReporter, ErrorCategory, ErrorSeverity } from '../../utils';
import { useNotifications } from '../../context/NotificationContext';

type Org = {
  alias?: string;
  username: string;
  orgId: string;
  instanceUrl: string;
  isActive: boolean;
  isDefaultDevHub: boolean;
  isDefaultUsername: boolean;
  connectedStatus: string;
  status: string;
};

type OrgManagerProps = {
  onBack: () => void;
};

export const OrgManager = ({ onBack }: OrgManagerProps) => {
  // Get access to the error handling system
  const { errors, dismissError } = useErrors();
  const { showNotification, updateNotification, dismissNotification } = useNotifications();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [output, setOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState<Record<string, string>>({});

  // Load orgs on component mount
  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    let notificationId = '';
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Show notification for loading orgs
      notificationId = showNotification({
        type: 'info',
        title: 'Loading Orgs',
        message: 'Fetching org list from Salesforce CLI...',
        progress: 0,
        maxProgress: 100
      });
      
      // Run sf org list command
      const { stdout } = await execa('sf', ['org', 'list', '--json']);
      
      // Update notification progress
      updateNotification(notificationId, {
        progress: 50,
        message: 'Processing org data...'
      });
      
      const result = JSON.parse(stdout);
      
      if (result.status === 0 && result.result) {
        const orgList = result.result.nonScratchOrgs.concat(result.result.scratchOrgs || []);
        setOrgs(orgList);
        
        // Complete notification with org count
        updateNotification(notificationId, {
          type: 'success',
          title: 'Orgs Loaded',
          message: `Found ${orgList.length} Salesforce orgs`,
          progress: 100,
          autoDismiss: true,
          dismissAfter: 3000
        });
      } else {
        setOrgs([]);
        // Report a warning if no orgs found
        if (!result.result || 
            ((!result.result.nonScratchOrgs || result.result.nonScratchOrgs.length === 0) && 
             (!result.result.scratchOrgs || result.result.scratchOrgs.length === 0))) {
          
          // Update notification to warning
          updateNotification(notificationId, {
            type: 'warning',
            title: 'No Orgs Found',
            message: 'Use the Auth Manager to log in to a Salesforce org.',
            progress: 100,
            autoDismiss: true,
            dismissAfter: 5000
          });
          
          errorReporter.reportError('No Salesforce orgs found', {
            severity: ErrorSeverity.LOW,
            category: ErrorCategory.AUTH,
            context: 'OrgManager',
            userAction: 'Use the Auth Manager to log in to a Salesforce org.'
          });
        }
      }
    } catch (err) {
      // Update local state for backward compatibility
      const errorMessage = `Failed to load orgs: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      setOrgs([]);
      
      // Update notification to error
      if (notificationId) {
        updateNotification(notificationId, {
          type: 'error',
          title: 'Error Loading Orgs',
          message: errorMessage,
          autoDismiss: true,
          dismissAfter: 5000,
          actions: [
            {
              label: 'Retry',
              action: loadOrgs
            }
          ]
        });
      }
      
      // Report error to the error reporting system
      errorReporter.reportError('Failed to load Salesforce orgs', {
        error: err instanceof Error ? err : new Error(String(err)),
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.COMMAND,
        context: 'OrgManager.loadOrgs',
        userAction: 'Check if Salesforce CLI is installed and properly configured.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgSelect = (org: Org) => {
    setSelectedOrg(org);
  };

  const runCommand = async (command: string, args: string[] = []) => {
    try {
      setIsProcessing(true);
      setOutput('');
      
      // Show notification for long-running operation
      const notificationTitle = getCommandTitle(command, args);
      const notificationId = showNotification({
        type: 'progress',
        title: notificationTitle,
        message: `Running: sf ${command} ${args.join(' ')}`,
        progress: 0,
        maxProgress: 100,
        autoDismiss: false
      });
      
      // Track this notification
      setActiveNotifications(prev => ({ ...prev, [command]: notificationId }));
      
      const process = execa('sf', [command, ...args]);
      let outputText = '';
      
      // Stream output
      process.stdout?.on('data', (data) => {
        const newOutput = data.toString();
        outputText += newOutput;
        setOutput(prev => prev + newOutput);
        
        // Update notification progress (approximate)
        updateNotification(notificationId, {
          progress: Math.min(95, (outputText.length / 500) * 100),
          message: `Running: sf ${command} ${args.join(' ')}\n${newOutput.slice(-50)}`
        });
      });
      
      process.stderr?.on('data', (data) => {
        const newOutput = data.toString();
        outputText += newOutput;
        setOutput(prev => prev + newOutput);
        
        // Update notification with warning
        updateNotification(notificationId, {
          type: 'warning',
          message: `Warning: ${newOutput.slice(-50)}`
        });
      });
      
      await process;
      
      // Complete notification
      updateNotification(notificationId, {
        type: 'success',
        title: `${notificationTitle} - Completed`,
        message: 'Command completed successfully',
        progress: 100,
        autoDismiss: true,
        dismissAfter: 5000
      });
      
      // Remove notification from tracking
      setActiveNotifications(prev => {
        const newState = { ...prev };
        delete newState[command];
        return newState;
      });
      
      // Refresh org list after command completes
      await loadOrgs();
    } catch (err) {
      const errorMessage = `Error: ${err instanceof Error ? err.message : String(err)}`;
      setOutput(errorMessage);
      
      // Update notification with error
      const notificationId = activeNotifications[command];
      if (notificationId) {
        updateNotification(notificationId, {
          type: 'error',
          title: `Error: ${getCommandTitle(command, args)}`,
          message: errorMessage,
          autoDismiss: true,
          dismissAfter: 8000,
          actions: [
            {
              label: 'Retry',
              action: () => runCommand(command, args)
            }
          ]
        });
        
        // Remove notification from tracking
        setActiveNotifications(prev => {
          const newState = { ...prev };
          delete newState[command];
          return newState;
        });
      }
      
      // Report error to the error reporting system
      errorReporter.reportCommandError(
        `Failed to execute Salesforce CLI command: sf ${command} ${args.join(' ')}`,
        err instanceof Error ? err : new Error(String(err)),
        { command, args }
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper to get a user-friendly title for command notifications
  const getCommandTitle = (command: string, args: string[]): string => {
    switch (command) {
      case 'org':
        if (args.includes('open')) return 'Opening Org';
        if (args.includes('display')) return 'Refreshing Org';
        if (args.includes('delete')) return 'Deleting Org';
        return 'Org Operation';
        
      case 'config':
        if (args.includes('target-org')) return 'Setting Default Org';
        if (args.includes('target-dev-hub')) return 'Setting Default DevHub';
        return 'Config Operation';
        
      case 'auth':
        if (args.includes('logout')) return 'Logging Out';
        return 'Auth Operation';
        
      default:
        return 'Salesforce CLI Operation';
    }
  };

  const openOrg = (org: Org) => {
    runCommand('org', ['open', '-o', org.username]);
  };

  const setDefaultOrg = (org: Org) => {
    runCommand('config', ['set', 'target-org', org.username, '--global']);
  };

  const setDefaultDevHub = (org: Org) => {
    runCommand('config', ['set', 'target-dev-hub', org.username, '--global']);
  };

  const refreshOrg = (org: Org) => {
    runCommand('org', ['display', '-o', org.username, '--verbose']);
  };

  const deleteOrg = async (org: Org) => {
    // Check if it's a scratch org first
    const isScratchOrg = org.status === 'Active' && org.username.includes('test.com');
    
    if (isScratchOrg) {
      // For scratch orgs, use delete command
      await runCommand('org', ['delete', 'scratch', '-o', org.username, '--no-prompt']);
    } else {
      // For other orgs, just remove the auth information
      await runCommand('auth', ['logout', '-o', org.username, '--no-prompt']);
    }
    
    // Refresh org list after deletion
    await loadOrgs();
    setSelectedOrg(null);
  };

  useInput((input, key) => {
    if (key.escape) {
      if (confirmDelete) {
        setConfirmDelete(false);
      } else if (selectedOrg) {
        setSelectedOrg(null);
      } else {
        onBack();
      }
    }
  });

  if (isLoading) {
    return (
      <Box>
        <Text><Spinner type="dots" /> Loading orgs...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text>Press ESC to go back</Text>
      </Box>
    );
  }

  if (selectedOrg) {
    if (confirmDelete) {
      return (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="red">⚠️  Delete Org Confirmation</Text>
          </Box>
          
          <Box marginBottom={2}>
            <Text>Are you sure you want to delete the org <Text bold>{selectedOrg.alias || selectedOrg.username}</Text>?</Text>
            <Text>This action {selectedOrg.username.includes('test.com') ? 'will PERMANENTLY delete the scratch org' : 'will revoke authentication for this org'}.</Text>
          </Box>
          
          <Box flexDirection="column" marginBottom={2}>
            <SelectInput
              items={[
                { label: '❌ Cancel - Keep this org', value: 'cancel' },
                { label: '⚠️ Yes, DELETE this org', value: 'confirm' },
              ]}
              onSelect={(item) => {
                if (item.value === 'confirm') {
                  deleteOrg(selectedOrg);
                } else {
                  setConfirmDelete(false);
                }
              }}
            />
          </Box>
          
          <Text color="gray" italic>
            Press ESC to cancel
          </Text>
        </Box>
      );
    }
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Org: {selectedOrg.alias || selectedOrg.username}</Text>
          <Text>  </Text>
          {selectedOrg.isDefaultUsername && <Text color="green">[Default]</Text>}
          {selectedOrg.isDefaultDevHub && <Text color="blue"> [DevHub]</Text>}
        </Box>
        
        <Box marginBottom={1}>
          <Text>Status: {selectedOrg.status}</Text>
        </Box>
        
        <Box marginBottom={2}>
          <Text>Instance: {selectedOrg.instanceUrl}</Text>
        </Box>
        
        <Box flexDirection="column" marginBottom={2}>
          <SelectInput
            items={[
              { label: 'Open Org in Browser', value: 'open' },
              { label: 'Set as Default Org', value: 'set-default' },
              { label: 'Set as Default Dev Hub', value: 'set-dev-hub' },
              { label: 'Refresh Org Info', value: 'refresh' },
              { label: 'Delete Org', value: 'delete' },
              { label: 'Back to List', value: 'back' },
            ]}
            onSelect={(item) => {
              switch (item.value) {
                case 'open':
                  openOrg(selectedOrg);
                  break;
                case 'set-default':
                  setDefaultOrg(selectedOrg);
                  break;
                case 'set-dev-hub':
                  setDefaultDevHub(selectedOrg);
                  break;
                case 'refresh':
                  refreshOrg(selectedOrg);
                  break;
                case 'delete':
                  setConfirmDelete(true);
                  break;
                case 'back':
                  setSelectedOrg(null);
                  break;
              }
            }}
          />
        </Box>
        
        {isProcessing && (
          <Box>
            <Text><Spinner type="dots" /> Processing...</Text>
          </Box>
        )}
        
        {output && (
          <Box flexDirection="column" borderStyle="round" padding={1}>
            <Text bold>Output:</Text>
            <Text>{output}</Text>
          </Box>
        )}
        
        <Text color="gray" italic>
          Press ESC to go back
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Your Salesforce Orgs</Text>
      </Box>
      
      {orgs.length === 0 ? (
        <Text>No orgs found. Use 'sf org login web' to authenticate with an org.</Text>
      ) : (
        <Box flexDirection="column">
          <SelectInput
            items={orgs.map(org => ({
              label: `${org.isDefaultUsername ? '★ ' : '  '}${org.alias || org.username}`,
              value: org.username,
              org
            }))}
            onSelect={(item: any) => handleOrgSelect(item.org)}
            itemComponent={({ isSelected, label, org }: { isSelected: boolean, label: string, org: Org }) => (
              <Box>
                <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
                <Text>  </Text>
                <Text color="gray">
                  {org.instanceUrl} {org.isDefaultDevHub && '(DevHub)'}
                </Text>
              </Box>
            )}
          />
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text>Press ESC to go back</Text>
      </Box>
    </Box>
  );
};

// Export with ErrorBoundary
export default function OrgManagerWithErrorBoundary(props: OrgManagerProps) {
  return (
    <ErrorBoundary componentName="OrgManager">
      <OrgManager {...props} />
    </ErrorBoundary>
  );
};
