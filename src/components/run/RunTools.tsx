import React, { useState } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { execa } from 'execa';
import Spinner from 'ink-spinner';
import { TextInput } from '../common/TextInput';

type RunTool = {
  id: string;
  label: string;
  description: string;
  requiresTargetOrg?: boolean;
};

type RunToolsProps = {
  onBack: () => void;
};

const RUN_TOOLS: RunTool[] = [
  {
    id: 'apex',
    label: 'Execute Anonymous Apex',
    description: 'Execute anonymous Apex code',
    requiresTargetOrg: true,
  },
  {
    id: 'flow',
    label: 'Run Flow',
    description: 'Run a Flow or Process Builder flow',
    requiresTargetOrg: true,
  },
  {
    id: 'test',
    label: 'Run Tests',
    description: 'Run Apex tests',
    requiresTargetOrg: true,
  },
  {
    id: 'soql',
    label: 'Execute SOQL Query',
    description: 'Run a SOQL query',
    requiresTargetOrg: true,
  },
  {
    id: 'data-tree',
    label: 'View Data Tree',
    description: 'Explore sObject data relationships',
    requiresTargetOrg: true,
  },
];

export const RunTools = ({ onBack }: RunToolsProps) => {
  const [selectedTool, setSelectedTool] = useState<RunTool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [targetOrg, setTargetOrg] = useState('');
  const [apexCode, setApexCode] = useState('System.debug(\'Hello from SF TUI!\');');
  const [flowName, setFlowName] = useState('');
  const [soqlQuery, setSoqlQuery] = useState('SELECT Id, Name FROM Account LIMIT 10');
  const [testClasses, setTestClasses] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToolSelect = (tool: RunTool) => {
    setSelectedTool(tool);
  };

  const executeTool = async () => {
    if (!selectedTool) return;
    
    try {
      setIsProcessing(true);
      setOutput('');
      setError('');
      
      let command = 'data';
      const args: string[] = [];
      
      switch (selectedTool.id) {
        case 'apex':
          command = 'apex';
          args.push('run', '--code', `"${apexCode}"`);
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
          
        case 'flow':
          command = 'flow';
          args.push('run', '--flow', flowName);
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
          
        case 'test':
          command = 'apex';
          args.push('run', 'test');
          if (testClasses) args.push('--class-names', testClasses);
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
          
        case 'soql':
          command = 'data';
          args.push('query', '--query', `"${soqlQuery}"`);
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
          
        case 'data-tree':
          command = 'data';
          args.push('tree', 'view');
          if (targetOrg) args.push('--target-org', targetOrg);
          break;
      }
      
      await runCommand(command, args);
    } catch (err) {
      setError(`Failed to execute ${selectedTool.label}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
        <Text bold>Run Tools</Text>
      </Box>
      
      <Box marginBottom={2}>
        <SelectInput
          items={RUN_TOOLS.map(tool => ({
            ...tool,
            label: `${tool.label} - ${tool.description}`,
            value: tool.id,
          }))}
          onSelect={(item) => handleToolSelect(item as unknown as RunTool)}
          itemComponent={({ isSelected, label }) => (
            <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
          )}
        />
      </Box>
      
      <Text color="gray" italic>Use arrow keys to navigate, Enter to select, ESC to go back</Text>
    </Box>
  );

  const renderApexTool = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Execute Anonymous Apex</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text>Enter your Apex code:</Text>
      </Box>
      
      <Box marginBottom={2} borderStyle="round" padding={1} height={10} overflow="hidden">
        <TextInput
          value={apexCode}
          onChange={setApexCode}
          multiline
          onSubmit={executeTool}
        />
      </Box>
      
      <Box marginBottom={2}>
        <Text>Target Org: </Text>
        <TextInput
          value={targetOrg}
          onChange={setTargetOrg}
          placeholder="username or alias"
        />
      </Box>
      
      <Box marginTop={1} marginBottom={2}>
        <SelectInput
          items={[
            { label: 'Execute', value: 'run' },
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
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderFlowTool = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Run Flow</Text>
      </Box>
      
      <Box marginBottom={2}>
        <Text>Flow API Name: </Text>
        <TextInput
          value={flowName}
          onChange={setFlowName}
          placeholder="My_Flow_API_Name"
        />
      </Box>
      
      <Box marginBottom={2}>
        <Text>Target Org: </Text>
        <TextInput
          value={targetOrg}
          onChange={setTargetOrg}
          placeholder="username or alias"
        />
      </Box>
      
      <Box marginTop={1} marginBottom={2}>
        <SelectInput
          items={[
            { label: 'Run Flow', value: 'run' },
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
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderTestTool = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Run Apex Tests</Text>
      </Box>
      
      <Box marginBottom={2}>
        <Text>Test Classes (comma-separated, leave empty for all tests):</Text>
        <TextInput
          value={testClasses}
          onChange={setTestClasses}
          placeholder="MyTestClass,AnotherTestClass"
        />
      </Box>
      
      <Box marginBottom={2}>
        <Text>Target Org: </Text>
        <TextInput
          value={targetOrg}
          onChange={setTargetOrg}
          placeholder="username or alias"
        />
      </Box>
      
      <Box marginTop={1} marginBottom={2}>
        <SelectInput
          items={[
            { label: 'Run Tests', value: 'run' },
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
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderSoqlTool = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Execute SOQL Query</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text>Enter your SOQL query:</Text>
      </Box>
      
      <Box marginBottom={2} borderStyle="round" padding={1} height={5} overflow="hidden">
        <TextInput
          value={soqlQuery}
          onChange={setSoqlQuery}
          onSubmit={executeTool}
        />
      </Box>
      
      <Box marginBottom={2}>
        <Text>Target Org: </Text>
        <TextInput
          value={targetOrg}
          onChange={setTargetOrg}
          placeholder="username or alias"
        />
      </Box>
      
      <Box marginTop={1} marginBottom={2}>
        <SelectInput
          items={[
            { label: 'Run Query', value: 'run' },
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
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderDataTreeTool = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>View Data Tree</Text>
      </Box>
      
      <Box marginBottom={2}>
        <Text>Explore sObject data relationships in your org.</Text>
      </Box>
      
      <Box marginBottom={2}>
        <Text>Target Org: </Text>
        <TextInput
          value={targetOrg}
          onChange={setTargetOrg}
          placeholder="username or alias"
        />
      </Box>
      
      <Box marginTop={1} marginBottom={2}>
        <SelectInput
          items={[
            { label: 'View Data Tree', value: 'run' },
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
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderToolForm = () => {
    if (!selectedTool) return null;
    
    switch (selectedTool.id) {
      case 'apex':
        return renderApexTool();
      case 'flow':
        return renderFlowTool();
      case 'test':
        return renderTestTool();
      case 'soql':
        return renderSoqlTool();
      case 'data-tree':
        return renderDataTreeTool();
      default:
        return null;
    }
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

export default RunTools;
