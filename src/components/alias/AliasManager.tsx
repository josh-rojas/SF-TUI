import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { execa } from 'execa';
import Spinner from 'ink-spinner';
import { TextInput } from '../common/TextInput';

type Alias = {
  alias: string;
  value: string;
};

type AliasManagerProps = {
  onBack: () => void;
};

export const AliasManager = ({ onBack }: AliasManagerProps) => {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [selectedAlias, setSelectedAlias] = useState<Alias | null>(null);
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'delete' | 'info'>('list');
  const [newAlias, setNewAlias] = useState('');
  const [aliasValue, setAliasValue] = useState('');

  // Load aliases on component mount
  useEffect(() => {
    loadAliases();
  }, []);

  const loadAliases = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Run sf alias list command
      const { stdout } = await execa('sf', ['alias', 'list', '--json']);
      const result = JSON.parse(stdout);
      
      if (result.status === 0 && result.result) {
        // Convert the result to an array of aliases
        const aliasList = Object.entries(result.result).map(([alias, value]) => ({
          alias,
          value: String(value)
        }));
        
        setAliases(aliasList);
      } else {
        setAliases([]);
      }
    } catch (err) {
      setError(`Failed to load aliases: ${err instanceof Error ? err.message : String(err)}`);
      setAliases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const runCommand = async (command: string, args: string[] = []) => {
    try {
      setOutput('');
      
      const process = execa('sf', [command, ...args]);
      
      // Stream output
      process.stdout?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      process.stderr?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      await process;
      
      // Refresh aliases after command completes
      await loadAliases();
      return true;
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias || !aliasValue) {
      setError('Both alias name and value are required');
      return;
    }
    
    const success = await runCommand('alias', ['set', newAlias, aliasValue]);
    if (success) {
      setNewAlias('');
      setAliasValue('');
      setView('list');
    }
  };

  const handleDeleteAlias = async (alias: string) => {
    const success = await runCommand('alias', ['unset', alias]);
    if (success) {
      setSelectedAlias(null);
      setView('list');
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      if (view !== 'list') {
        setView('list');
        setSelectedAlias(null);
      } else {
        onBack();
      }
    }
  });

  const renderList = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Your Salesforce CLI Aliases</Text>
      </Box>
      
      {isLoading ? (
        <Box>
          <Text><Spinner type="dots" /> Loading aliases...</Text>
        </Box>
      ) : error ? (
        <Text color="red">Error: {error}</Text>
      ) : aliases.length === 0 ? (
        <Text>No aliases found. Create one to get started.</Text>
      ) : (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <SelectInput
              items={[
                ...aliases.map(alias => ({
                  label: `${alias.alias} = ${alias.value}`,
                  value: alias.alias,
                  alias
                })),
                { label: '➕ Add New Alias', value: 'add' }
              ]}
              onSelect={(item) => {
                if (item.value === 'add') {
                  setView('add');
                } else {
                  setSelectedAlias((item as any).alias);
                  setView('info');
                }
              }}
              itemComponent={({ isSelected, label }) => (
                <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
              )}
            />
          </Box>
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text>Press ESC to go back</Text>
      </Box>
    </Box>
  );

  const renderAddForm = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Add New Alias</Text>
      </Box>
      
      <Box marginBottom={1} flexDirection="column">
        <Box marginBottom={1}>
          <Text>Alias Name: </Text>
          <TextInput
            value={newAlias}
            onChange={setNewAlias}
            placeholder="my-alias"
          />
        </Box>
        
        <Box marginBottom={2}>
          <Text>Alias Value: </Text>
          <TextInput
            value={aliasValue}
            onChange={setAliasValue}
            placeholder="user@example.com or 00D..."
          />
        </Box>
        
        <Box flexDirection="column" marginBottom={2}>
          <SelectInput
            items={[
              { label: 'Create Alias', value: 'create' },
              { label: 'Cancel', value: 'cancel' },
            ]}
            onSelect={(item) => {
              if (item.value === 'create') {
                handleAddAlias();
              } else {
                setView('list');
              }
            }}
          />
        </Box>
      </Box>
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderAliasInfo = () => {
    if (!selectedAlias) return null;
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Alias: {selectedAlias.alias}</Text>
        </Box>
        
        <Box marginBottom={2}>
          <Text>Value: {selectedAlias.value}</Text>
        </Box>
        
        <Box flexDirection="column" marginBottom={2}>
          <SelectInput
            items={[
              { label: 'Edit Alias', value: 'edit' },
              { label: 'Delete Alias', value: 'delete' },
              { label: 'Back to List', value: 'back' },
            ]}
            onSelect={(item) => {
              switch (item.value) {
                case 'edit':
                  setNewAlias(selectedAlias.alias);
                  setAliasValue(selectedAlias.value);
                  setView('edit');
                  break;
                case 'delete':
                  setView('delete');
                  break;
                case 'back':
                  setView('list');
                  setSelectedAlias(null);
                  break;
              }
            }}
          />
        </Box>
        
        <Text color="gray" italic>ESC to go back</Text>
      </Box>
    );
  };

  const renderDeleteConfirmation = () => {
    if (!selectedAlias) return null;
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Delete Alias</Text>
        </Box>
        
        <Box marginBottom={2}>
          <Text>Are you sure you want to delete the alias '{selectedAlias.alias}'?</Text>
          <Text>Value: {selectedAlias.value}</Text>
        </Box>
        
        <Box flexDirection="column" marginBottom={2}>
          <SelectInput
            items={[
              { label: '✅ Yes, delete it', value: 'confirm' },
              { label: '❌ No, keep it', value: 'cancel' },
            ]}
            onSelect={(item) => {
              if (item.value === 'confirm') {
                handleDeleteAlias(selectedAlias.alias);
              } else {
                setView('info');
              }
            }}
          />
        </Box>
        
        <Text color="gray" italic>ESC to go back</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>Salesforce CLI Alias Manager</Text>
      </Box>
      
      {view === 'list' && renderList()}
      {view === 'add' && renderAddForm()}
      {view === 'info' && renderAliasInfo()}
      {view === 'delete' && renderDeleteConfirmation()}
      
      {output && (
        <Box marginTop={1} borderStyle="round" padding={1}>
          <Text>{output}</Text>
        </Box>
      )}
      
      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
};

export default AliasManager;
