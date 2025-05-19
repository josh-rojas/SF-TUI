import React, { useState } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { execa } from 'execa';
import Spinner from 'ink-spinner';
import { TextInput } from '../common/TextInput';

type ProjectManagerProps = {
  onBack: () => void;
};

type ProjectType = 'standard' | 'empty' | 'analytics' | 'functions' | 'lwc' | 'pkg';

const PROJECT_TYPES = [
  {
    label: 'Standard Project',
    value: 'standard',
    description: 'A standard Salesforce project with the default settings',
  },
  {
    label: 'Empty Project',
    value: 'empty',
    description: 'Create an empty Salesforce project',
  },
  {
    label: 'Analytics Project',
    value: 'analytics',
    description: 'A project with Analytics (Wave) templates',
  },
  {
    label: 'Functions Project',
    value: 'functions',
    description: 'A project with Salesforce Functions support',
  },
  {
    label: 'LWC Project',
    value: 'lwc',
    description: 'A project optimized for Lightning Web Components',
  },
  {
    label: 'Package Project',
    value: 'pkg',
    description: 'A project for developing unlocked or managed packages',
  },
];

export const ProjectGenerator = ({ onBack }: ProjectManagerProps) => {
  const [step, setStep] = useState<'type' | 'name' | 'directory' | 'creating'>('type');
  const [projectType, setProjectType] = useState<ProjectType>('standard');
  const [projectName, setProjectName] = useState('my-sfdx-project');
  const [directory, setDirectory] = useState(process.cwd());
  const [output, setOutput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdProjectPath, setCreatedProjectPath] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'type') {
        onBack();
      } else {
        setStep('type');
      }
    }
  });

  const createProject = async () => {
    setIsCreating(true);
    setOutput('');
    
    try {
      const args = ['project', 'generate', '--name', projectName];
      
      // Add project type specific flags
      switch (projectType) {
        case 'empty':
          args.push('--empty');
          break;
        case 'analytics':
          args.push('--template', 'analytics');
          break;
        case 'functions':
          args.push('--template', 'functions');
          break;
        case 'lwc':
          args.push('--template', 'lwc');
          break;
        case 'pkg':
          args.push('--template', 'package');
          break;
        // 'standard' is the default
      }
      
      // Set output directory
      const projectPath = `${directory}/${projectName}`.replace(/\/\//g, '/');
      args.push('--output-dir', directory);
      
      const process = execa('sf', args);
      
      // Stream output
      process.stdout?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      process.stderr?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      await process;
      
      setCreatedProjectPath(projectPath);
      setStep('creating');
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCreating(false);
    }
  };

  const renderProjectTypeStep = () => (
    <Box flexDirection="column">
      <Text bold>Select Project Type</Text>
      <Text>Choose the type of Salesforce project you'd like to create:</Text>
      
      <Box marginTop={1} marginBottom={2}>
        <SelectInput
          items={PROJECT_TYPES.map(type => ({
            ...type,
            key: type.value,
          }))}
          onSelect={(item) => {
            setProjectType(item.value as ProjectType);
            setStep('name');
          }}
          itemComponent={({ isSelected, label, description }: { isSelected: boolean, label: string, description: string }) => (
            <Box>
              <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
              <Text>  </Text>
              <Text color="gray">{description}</Text>
            </Box>
          )}
        />
      </Box>
      
      <Text color="gray" italic>Use arrow keys to navigate, Enter to select, ESC to go back</Text>
    </Box>
  );

  const renderProjectNameStep = () => (
    <Box flexDirection="column">
      <Text bold>Project Name</Text>
      <Text>Enter a name for your project (alphanumeric and hyphens only):</Text>
      
      <Box marginTop={1} marginBottom={2}>
        <Text>Project name: </Text>
        <TextInput
          value={projectName}
          onChange={setProjectName}
          onSubmit={() => setStep('directory')}
          validate={(value) => /^[a-zA-Z0-9-]+$/.test(value) || 'Project name can only contain letters, numbers, and hyphens'}
        />
      </Box>
      
      <Text color="gray" italic>Press Enter to continue, ESC to go back</Text>
    </Box>
  );

  const renderDirectoryStep = () => (
    <Box flexDirection="column">
      <Text bold>Project Directory</Text>
      <Text>Where would you like to create the project?</Text>
      
      <Box marginTop={1} marginBottom={1}>
        <Text>Directory: </Text>
        <TextInput
          value={directory}
          onChange={setDirectory}
          onSubmit={createProject}
        />
      </Box>
      
      <Box marginBottom={2}>
        <Text>Full path: {directory}/{projectName}</Text>
      </Box>
      
      <Box flexDirection="column" marginBottom={2}>
        <SelectInput
          items={[
            { label: 'Create Project', value: 'create' },
            { label: 'Change Project Type', value: 'type' },
            { label: 'Change Project Name', value: 'name' },
            { label: 'Cancel', value: 'cancel' },
          ]}
          onSelect={(item) => {
            switch (item.value) {
              case 'create':
                createProject();
                break;
              case 'type':
                setStep('type');
                break;
              case 'name':
                setStep('name');
                break;
              case 'cancel':
                onBack();
                break;
            }
          }}
        />
      </Box>
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderCreatingStep = () => (
    <Box flexDirection="column">
      {isCreating ? (
        <>
          <Text><Spinner type="dots" /> Creating project...</Text>
          <Box marginTop={1} borderStyle="round" padding={1} height={10} overflow="hidden">
            <Text>{output || 'Initializing project...'}</Text>
          </Box>
        </>
      ) : createdProjectPath ? (
        <Box flexDirection="column">
          <Text color="green">✓ Project created successfully!</Text>
          <Newline />
          <Text>Project location: {createdProjectPath}</Text>
          <Newline />
          <Text>Next steps:</Text>
          <Text>  1. <Text color="cyan">cd {createdProjectPath.split('/').pop()}</Text></Text>
          <Text>  2. <Text color="cyan">sft</Text> to open the TUI in your new project</Text>
          <Newline />
          <Text>Press any key to continue...</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text color="red">Error creating project</Text>
          <Box marginTop={1} borderStyle="round" padding={1} height={10} overflow="hidden">
            <Text>{output || 'Unknown error occurred'}</Text>
          </Box>
          <Newline />
          <Text>Press any key to continue...</Text>
        </Box>
      )}
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>New Salesforce Project</Text>
      </Box>
      
      {step === 'type' && renderProjectTypeStep()}
      {step === 'name' && renderProjectNameStep()}
      {step === 'directory' && renderDirectoryStep()}
      {step === 'creating' && renderCreatingStep()}
      
      {step !== 'creating' && (
        <Text color="gray" italic>
          ESC to go back
        </Text>
      )}
    </Box>
  );
};

export default ProjectGenerator;
