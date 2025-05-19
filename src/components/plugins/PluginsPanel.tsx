import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { execa } from 'execa';
import Spinner from 'ink-spinner';
import { TextInput } from '../common/TextInput';

type Plugin = {
  name: string;
  version: string;
  type: string;
  location?: string;
  homepage?: string;
  updateAvailable?: boolean;
  latestVersion?: string;
};

type PluginsPanelProps = {
  onBack: () => void;
};

export const PluginsPanel = ({ onBack }: PluginsPanelProps) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'list' | 'details' | 'install' | 'update' | 'uninstall'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [installPluginName, setInstallPluginName] = useState('');
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);

  // Load plugins on component mount
  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Run sf plugins command
      const { stdout } = await execa('sf', ['plugins', '--json']);
      const result = JSON.parse(stdout);
      
      if (Array.isArray(result)) {
        setPlugins(result);
      } else {
        setPlugins([]);
      }
    } catch (err) {
      setError(`Failed to load plugins: ${err instanceof Error ? err.message : String(err)}`);
      setPlugins([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      setIsCheckingForUpdates(true);
      setOutput('');
      
      const process = execa('sf', ['plugins', 'update', '--json']);
      
      // Stream output
      process.stdout?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      process.stderr?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      await process;
      
      // Reload plugins after update check
      await loadPlugins();
    } catch (err) {
      setError(`Error checking for updates: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCheckingForUpdates(false);
    }
  };

  const runCommand = async (command: string, args: string[] = []) => {
    try {
      setIsProcessing(true);
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
      
      // Reload plugins after command completes
      await loadPlugins();
      return true;
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const installPlugin = async (pluginName: string) => {
    const success = await runCommand('plugins', ['install', pluginName]);
    if (success) {
      setInstallPluginName('');
      setView('list');
    }
  };

  const updatePlugin = async (pluginName: string) => {
    await runCommand('plugins', ['update', pluginName]);
  };

  const uninstallPlugin = async (pluginName: string) => {
    await runCommand('plugins', ['uninstall', pluginName]);
    setSelectedPlugin(null);
    setView('list');
  };

  const updateAllPlugins = async () => {
    await runCommand('plugins', ['update']);
  };

  const handlePluginSelect = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setView('details');
  };

  useInput((input, key) => {
    if (key.escape) {
      if (view !== 'list') {
        setView('list');
        setSelectedPlugin(null);
      } else {
        onBack();
      }
    }
  });

  const renderPluginList = () => {
    const filteredPlugins = plugins.filter(plugin => 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Installed Plugins</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text>Search: </Text>
          <TextInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Filter plugins..."
          />
        </Box>
        
        {isLoading ? (
          <Box>
            <Text><Spinner type="dots" /> Loading plugins...</Text>
          </Box>
        ) : error ? (
          <Text color="red">Error: {error}</Text>
        ) : filteredPlugins.length === 0 ? (
          <Text>No plugins found. Install some plugins to get started.</Text>
        ) : (
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <SelectInput
                items={[
                  ...filteredPlugins.map(plugin => ({
                    label: `${plugin.name}@${plugin.version} ${plugin.updateAvailable ? '🔄' : ''}`,
                    value: plugin.name,
                    plugin
                  })),
                  { label: '➕ Install New Plugin', value: 'install' },
                  { label: '🔄 Update All Plugins', value: 'update-all' },
                  { label: '🔍 Check for Updates', value: 'check-updates' },
                ]}
                onSelect={(item) => {
                  if (item.value === 'install') {
                    setView('install');
                  } else if (item.value === 'update-all') {
                    updateAllPlugins();
                  } else if (item.value === 'check-updates') {
                    checkForUpdates();
                  } else {
                    // Type assertion for custom plugin property
                    const customItem = item as any;
                    handlePluginSelect(customItem.plugin);
                  }
                }}
                itemComponent={({ isSelected, label, plugin }) => (
                  <Box>
                    <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
                    {plugin?.updateAvailable && (
                      <Text color="yellow"> (update to {plugin.latestVersion} available)</Text>
                    )}
                  </Box>
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
  };

  const renderPluginDetails = () => {
    if (!selectedPlugin) return null;
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Plugin: {selectedPlugin.name}</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text>Version: {selectedPlugin.version}</Text>
          {selectedPlugin.updateAvailable && (
            <Text color="yellow">Update available: {selectedPlugin.latestVersion}</Text>
          )}
        </Box>
        
        <Box marginBottom={1}>
          <Text>Type: {selectedPlugin.type}</Text>
        </Box>
        
        {selectedPlugin.location && (
          <Box marginBottom={1}>
            <Text>Location: {selectedPlugin.location}</Text>
          </Box>
        )}
        
        {selectedPlugin.homepage && (
          <Box marginBottom={2}>
            <Text>Homepage: {selectedPlugin.homepage}</Text>
          </Box>
        )}
        
        <Box flexDirection="column" marginBottom={2}>
          <SelectInput
            items={[
              ...(selectedPlugin.updateAvailable ? [{
                label: `🔄 Update to v${selectedPlugin.latestVersion}`,
                value: 'update',
              }] : []),
              { label: 'Uninstall Plugin', value: 'uninstall' },
              { label: 'Back to List', value: 'back' },
            ]}
            onSelect={(item) => {
              switch (item.value) {
                case 'update':
                  setView('update');
                  updatePlugin(selectedPlugin.name);
                  break;
                case 'uninstall':
                  setView('uninstall');
                  break;
                case 'back':
                  setView('list');
                  setSelectedPlugin(null);
                  break;
              }
            }}
          />
        </Box>
        
        <Text color="gray" italic>ESC to go back</Text>
      </Box>
    );
  };

  const renderInstallForm = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Install New Plugin</Text>
      </Box>
      
      <Box marginBottom={2}>
        <Text>Plugin name or npm package:</Text>
        <TextInput
          value={installPluginName}
          onChange={setInstallPluginName}
          placeholder="@salesforce/plugin-name or plugin-name"
        />
      </Box>
      
      <Box marginBottom={2}>
        <Text>Example: @salesforce/plugin-org, @salesforce/plugin-apex, etc.</Text>
      </Box>
      
      <Box flexDirection="column" marginBottom={2}>
        <SelectInput
          items={[
            { label: 'Install', value: 'install' },
            { label: 'Cancel', value: 'cancel' },
          ]}
          onSelect={(item) => {
            if (item.value === 'install' && installPluginName) {
              installPlugin(installPluginName);
            } else {
              setView('list');
            }
          }}
        />
      </Box>
      
      <Text color="gray" italic>ESC to go back</Text>
    </Box>
  );

  const renderUninstallConfirmation = () => {
    if (!selectedPlugin) return null;
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Uninstall Plugin</Text>
        </Box>
        
        <Box marginBottom={2}>
          <Text>Are you sure you want to uninstall {selectedPlugin.name}?</Text>
          <Text>Version: {selectedPlugin.version}</Text>
        </Box>
        
        <Box flexDirection="column" marginBottom={2}>
          <SelectInput
            items={[
              { label: '✅ Yes, uninstall it', value: 'confirm' },
              { label: '❌ No, keep it', value: 'cancel' },
            ]}
            onSelect={(item) => {
              if (item.value === 'confirm') {
                uninstallPlugin(selectedPlugin.name);
              } else {
                setView('details');
              }
            }}
          />
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
      {isProcessing || isCheckingForUpdates ? (
        <Box>
          <Text><Spinner type="dots" /> {isCheckingForUpdates ? 'Checking for updates...' : 'Processing...'}</Text>
        </Box>
      ) : (
        <>
          {view === 'list' && renderPluginList()}
          {view === 'details' && renderPluginDetails()}
          {view === 'install' && renderInstallForm()}
          {view === 'uninstall' && renderUninstallConfirmation()}
          {renderOutput()}
        </>
      )}
    </Box>
  );
};

export default PluginsPanel;
