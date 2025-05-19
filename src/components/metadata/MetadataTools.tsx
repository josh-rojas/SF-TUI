import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { execa } from 'execa';
import Spinner from 'ink-spinner';
import { TextInput } from '../common/TextInput';
import { ErrorBoundary, useErrors } from '../common';
import { errorReporter, ErrorCategory, ErrorSeverity } from '../../utils';

type MetadataTool = {
  id: string;
  label: string;
  description: string;
  requiresTargetOrg?: boolean;
  requiresSourceOrg?: boolean;
  requiresManifest?: boolean;
  requiresMetadata?: boolean;
};

type MetadataToolsProps = {
  onBack: () => void;
};

const METADATA_TOOLS: MetadataTool[] = [
  {
    id: 'deploy',
    label: 'Deploy Metadata',
    description: 'Deploy metadata to an org',
    requiresTargetOrg: true,
    requiresManifest: true,
  },
  {
    id: 'retrieve',
    label: 'Retrieve Metadata',
    description: 'Retrieve metadata from an org',
    requiresSourceOrg: true,
    requiresManifest: true,
  },
  {
    id: 'deploy-dir',
    label: 'Deploy Directory',
    description: 'Deploy all metadata from a directory',
    requiresTargetOrg: true,
  },
  {
    id: 'retrieve-dir',
    label: 'Retrieve to Directory',
    description: 'Retrieve metadata to a directory',
    requiresSourceOrg: true,
  },
  {
    id: 'validate',
    label: 'Validate Deployment',
    description: 'Validate a deployment without making changes',
    requiresTargetOrg: true,
    requiresManifest: true,
  },
  {
    id: 'list',
    label: 'List Metadata',
    description: 'List metadata in an org',
    requiresSourceOrg: true,
  },
  {
    id: 'describe',
    label: 'Describe Metadata',
    description: 'Describe metadata types in an org',
    requiresSourceOrg: true,
  },
];

type Org = {
  username: string;
  isDefault: boolean;
  alias?: string;
  connectedStatus?: string;
  isScratch?: boolean;
};

export const MetadataTools = ({ onBack }: MetadataToolsProps) => {
  // Get access to the error handling system
  const { errors, dismissError } = useErrors();
  const [selectedTool, setSelectedTool] = useState<MetadataTool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [targetOrg, setTargetOrg] = useState('');
  const [sourceOrg, setSourceOrg] = useState('');
  const [manifestFile, setManifestFile] = useState('manifest/package.xml');
  const [metadata, setMetadata] = useState('');
  const [directory, setDirectory] = useState('force-app/main/default');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);

  // Load orgs from SF CLI
  const loadOrgs = async () => {
    try {
      setIsLoading(true);
      const { stdout } = await execa('sf', ['org', 'list', '--json']);
      
      // Parse the JSON output
      const result = JSON.parse(stdout);
      
      if (result.status === 0 && result.result && Array.isArray(result.result.nonScratchOrgs)) {
        // Return both scratch and non-scratch orgs
        const allOrgs = [
          ...(result.result.nonScratchOrgs || []).map((org: any) => ({
            username: org.username,
            isDefault: org.isDefaultUsername || false,
            alias: org.alias || '',
            connectedStatus: org.connectedStatus || '',
          })),
          ...(result.result.scratchOrgs || []).map((org: any) => ({
            username: org.username,
            isDefault: org.isDefaultUsername || false,
            alias: org.alias || '',
            connectedStatus: org.connectedStatus || '',
            isScratch: true,
          })),
        ];
        
        return allOrgs;
      }
      
      errorReporter.reportError('Failed to load orgs', {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SYSTEM,
        context: 'MetadataTools.loadOrgs',
        details: { result },
      });
      
      return [];
    } catch (err) {
      errorReporter.reportCommandError(
        'Failed to load orgs from Salesforce CLI',
        err instanceof Error ? err : new Error(String(err)),
        { command: 'sf org list --json' }
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const runCommand = async (command: string, args: string[] = []) => {
    try {
      setIsProcessing(true);
      setOutput('');
      setError('');
      
      const process = execa('sf', [command, ...args]);
      
      // Stream output
      process.stdout?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      process.stderr?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      await process;
      return true;
    } catch (err) {
      const errorMessage = `Error: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      
      // Report error to the error reporting system
      errorReporter.reportCommandError(
        `Failed to execute Salesforce CLI command: sf ${command} ${args.join(' ')}`,
        err instanceof Error ? err : new Error(String(err)),
        { command, args }
      );
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToolSelect = (tool: MetadataTool) => {
    setSelectedTool(tool);
  };

  const executeTool = async () => {
    if (!selectedTool) return;
    
    try {
      setIsProcessing(true);
      setOutput('');
      setError('');
      
      let command = 'project';
      const args: string[] = [];
      
      // Validate required fields
      if (selectedTool.requiresTargetOrg && !targetOrg) {
        setError('Target org is required for this operation');
        errorReporter.reportValidationError(
          `Target org is required for the ${selectedTool.label} operation`,
          undefined,
          { tool: selectedTool.id }
        );
        setIsProcessing(false);
        return;
      }
      
      if (selectedTool.requiresSourceOrg && !sourceOrg) {
        setError('Source org is required for this operation');
        errorReporter.reportValidationError(
          `Source org is required for the ${selectedTool.label} operation`,
          undefined,
          { tool: selectedTool.id }
        );
        setIsProcessing(false);
        return;
      }
      
      if (selectedTool.requiresManifest && !manifestFile) {
        setError('Manifest file is required for this operation');
        errorReporter.reportValidationError(
          `Manifest file is required for the ${selectedTool.label} operation`,
          undefined,
          { tool: selectedTool.id }
        );
        setIsProcessing(false);
        return;
      }
      
      switch (selectedTool.id) {
        case 'deploy':
          command = 'project';
          args.push('deploy', 'start', '--manifest', manifestFile);
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
          
        case 'retrieve':
          command = 'project';
          args.push('retrieve', 'start', '--manifest', manifestFile);
          if (sourceOrg) args.push('--source-org', sourceOrg);
          break;
          
        case 'deploy-dir':
          command = 'project';
          args.push('deploy', 'start', '--source-dir', directory);
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
          
        case 'retrieve-dir':
          command = 'project';
          args.push('retrieve', 'start', '--output-dir', directory);
          if (sourceOrg) args.push('--source-org', sourceOrg);
          break;
          
        case 'validate':
          command = 'project';
          args.push('deploy', 'validate', '--manifest', manifestFile);
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
          
        case 'list':
          command = 'org';
          args.push('list', 'metadata');
          if (sourceOrg) args.push('--target-org', sourceOrg);
          if (metadata) args.push('--metadata', metadata);
          break;
          
        case 'describe':
          command = 'org';
          args.push('describe', 'metadata');
          if (sourceOrg) args.push('--target-org', sourceOrg);
          break;
      }
      
      await runCommand(command, args);
    } catch (err) {
      const errorMessage = `Failed to execute ${selectedTool.label}: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      
      // Report error to the error reporting system
      errorReporter.reportError(`Failed to execute ${selectedTool.label}`, {
        error: err instanceof Error ? err : new Error(String(err)),
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.COMMAND,
        context: 'MetadataTools.executeTool',
        details: { tool: selectedTool },
        userAction: 'Check the command parameters and try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load orgs when component is mounted
  useEffect(() => {
    const fetchOrgs = async () => {
      const loadedOrgs = await loadOrgs();
      setOrgs(loadedOrgs);
    };
    
    fetchOrgs();
  }, []);
  
  useInput((input, key) => {
    if (key.escape) {
      if (selectedTool) {
        setSelectedTool(null);
      } else {
        onBack();
      }
    }
  });

  const renderToolList = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Metadata Tools</Text>
      </Box>
      
      <Box marginBottom={2}>
        <SelectInput
          items={METADATA_TOOLS.map(tool => ({
            ...tool,
            label: `${tool.label} - ${tool.description}`,
            value: tool.id,
          }))}
          onSelect={(item) => handleToolSelect(item as unknown as MetadataTool)}
          itemComponent={({ isSelected, label }) => (
            <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
          )}
        />
      </Box>
      
      <Text color="gray" italic>Use arrow keys to navigate, Enter to select, ESC to go back</Text>
    </Box>
  );

  const renderToolForm = () => {
    if (!selectedTool) return null;
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>{selectedTool.label}</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text>{selectedTool.description}</Text>
        </Box>
        
        <Box flexDirection="column" marginTop={1}>
          {selectedTool.requiresTargetOrg && (
            <Box marginBottom={1} flexDirection="column">
              <Text>Target Org:</Text>
              {orgs.length > 0 ? (
                <Box marginTop={1}>
                  <SelectInput
                    items={orgs.map(org => ({
                      label: `${org.username}${org.alias ? ` (${org.alias})` : ''}${org.isDefault ? ' [default]' : ''}`,
                      value: org.username
                    }))}
                    onSelect={(item) => setTargetOrg(item.value)}
                  />
                </Box>
              ) : isLoading ? (
                <Box marginTop={1}>
                  <Text><Spinner type="dots" /> Loading orgs...</Text>
                </Box>
              ) : (
                <Box marginTop={1}>
                  <TextInput
                    value={targetOrg}
                    onChange={setTargetOrg}
                    placeholder="username or alias"
                  />
                  <Text color="gray" marginLeft={1}>(No orgs found. Manual entry required)</Text>
                </Box>
              )}
            </Box>
          )}
          
          {selectedTool.requiresSourceOrg && (
            <Box marginBottom={1} flexDirection="column">
              <Text>Source Org:</Text>
              {orgs.length > 0 ? (
                <Box marginTop={1}>
                  <SelectInput
                    items={orgs.map(org => ({
                      label: `${org.username}${org.alias ? ` (${org.alias})` : ''}${org.isDefault ? ' [default]' : ''}`,
                      value: org.username
                    }))}
                    onSelect={(item) => setSourceOrg(item.value)}
                  />
                </Box>
              ) : isLoading ? (
                <Box marginTop={1}>
                  <Text><Spinner type="dots" /> Loading orgs...</Text>
                </Box>
              ) : (
                <Box marginTop={1}>
                  <TextInput
                    value={sourceOrg}
                    onChange={setSourceOrg}
                    placeholder="username or alias"
                  />
                  <Text color="gray" marginLeft={1}>(No orgs found. Manual entry required)</Text>
                </Box>
              )}
            </Box>
          )}
          
          {selectedTool.requiresManifest && (
            <Box marginBottom={1}>
              <Text>Manifest File: </Text>
              <TextInput
                value={manifestFile}
                onChange={setManifestFile}
                placeholder="path/to/package.xml"
              />
            </Box>
          )}
          
          {(selectedTool.id === 'deploy-dir' || selectedTool.id === 'retrieve-dir') && (
            <Box marginBottom={1}>
              <Text>Directory: </Text>
              <TextInput
                value={directory}
                onChange={setDirectory}
                placeholder="path/to/directory"
              />
            </Box>
          )}
          
          {selectedTool.id === 'list' && (
            <Box marginBottom={1}>
              <Text>Metadata Type (optional): </Text>
              <TextInput
                value={metadata}
                onChange={setMetadata}
                placeholder="ApexClass,CustomObject,..."
              />
            </Box>
          )}
          
          <Box marginTop={2} marginBottom={2}>
            <SelectInput
              items={[
                { label: 'Run Command', value: 'run' },
                { label: 'Back to Tools', value: 'back' },
              ]}
              onSelect={(item) => {
                if (item.value === 'run') {
                  executeTool();
                } else {
                  setSelectedTool(null);
                }
              }}
            />
          </Box>
        </Box>
        
        <Text color="gray" italic>ESC to go back</Text>
      </Box>
    );
  };

  const renderOutput = () => {
    if (!output && !error) return null;
    
    return (
      <Box marginTop={2} flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Output:</Text>
        </Box>
        <Box borderStyle="round" padding={1} height={10} overflow="hidden">
          <Text>{error || output}</Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      {isProcessing ? (
        <Box>
          <Text><Spinner type="dots" /> Processing...</Text>
        </Box>
      ) : selectedTool ? (
        <>
          {renderToolForm()}
          {renderOutput()}
        </>
      ) : (
        renderToolList()
      )}
    </Box>
  );
};

// Export with ErrorBoundary
export default function MetadataToolsWithErrorBoundary(props: MetadataToolsProps) {
  return (
    <ErrorBoundary componentName="MetadataTools">
      <MetadataTools {...props} />
    </ErrorBoundary>
  );
};
