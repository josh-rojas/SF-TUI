import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { execa } from 'execa';
import Spinner from 'ink-spinner';
import open from 'open';
import { TextInput } from '../common/TextInput';
import { SelectInputItem } from 'ink-select-input';

interface AuthMethodItem extends SelectInputItem {
  description: string;
  requiresInput: boolean;
}

type AuthManagerProps = {
  onBack: () => void;
};

type AuthMethod = 'web' | 'jwt' | 'device' | 'token' | 'soap';

const AUTH_METHODS = [
  {
    label: 'Web Login (Recommended)',
    value: 'web',
    description: 'Opens a browser window to log in to your org',
    requiresInput: false,
  },
  {
    label: 'JWT Bearer Flow',
    value: 'jwt',
    description: 'Authenticate using a JWT bearer token',
    requiresInput: true,
  },
  {
    label: 'Device Code Flow',
    value: 'device',
    description: 'Authenticate using a device code',
    requiresInput: false,
  },
  {
    label: 'Access Token',
    value: 'token',
    description: 'Authenticate with an existing access token',
    requiresInput: true,
  },
  {
    label: 'SOAP Username-Password',
    value: 'soap',
    description: 'Authenticate with username and password (not recommended)',
    requiresInput: true,
  },
];

export const AuthManager = ({ onBack }: AuthManagerProps) => {
  const [step, setStep] = useState<'method' | 'input' | 'authenticating' | 'success' | 'error'>('method');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('web');
  const [alias, setAlias] = useState('');
  const [username, setUsername] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [deviceCode, setDeviceCode] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'method') {
        onBack();
      } else {
        setStep('method');
      }
    }
  });

  const startAuthFlow = async () => {
    setIsProcessing(true);
    setOutput('');
    setError('');
    
    try {
      const args = ['org', 'login'];
      let process;
      
      switch (selectedMethod) {
        case 'web':
          args.push('web', '--browser', 'chrome');
          if (alias) args.push('--alias', alias);
          if (username) args.push('--username', username);
          break;
          
        case 'jwt':
          // This is a simplified example - in a real app, you'd collect these values
          args.push('jwt', '--username', username, '--jwt-key-file', 'path/to/server.key');
          if (alias) args.push('--alias', alias);
          break;
          
        case 'device':
          args.push('device', '--browser', 'chrome');
          if (alias) args.push('--alias', alias);
          break;
          
        case 'token':
          // This would be collected from user input
          args.push('access-token', '--instance-url', 'https://login.salesforce.com', '--access-token', 'YOUR_TOKEN');
          if (alias) args.push('--alias', alias);
          break;
          
        case 'soap':
          // This would be collected from user input
          args.push('soap', '--username', username, '--password', 'YOUR_PASSWORD');
          if (alias) args.push('--alias', alias);
          break;
      }
      
      process = execa('sf', args);
      
      // Handle output
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        setOutput(prev => prev + output);
        
        // Handle web login URL
        if (selectedMethod === 'web' && output.includes('https://')) {
          const urlMatch = output.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            setAuthUrl(urlMatch[0]);
            open(urlMatch[0]);
          }
        }
        
        // Handle device code flow
        if (selectedMethod === 'device') {
          if (output.includes('https://')) {
            const urlMatch = output.match(/https?:\/\/[^\s]+/);
            if (urlMatch) setAuthUrl(urlMatch[0]);
          }
          if (output.includes('code:')) {
            const codeMatch = output.match(/code:\s*([^\s]+)/);
            if (codeMatch) setDeviceCode(codeMatch[1]);
          }
        }
      });
      
      process.stderr?.on('data', (data) => {
        setOutput(prev => prev + data.toString());
      });
      
      await process;
      
      // If we get here, authentication was successful
      setStep('success');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMethodStep = () => (
    <Box flexDirection="column">
      <Text bold>Authentication Method</Text>
      <Text>Choose how you'd like to authenticate with Salesforce:</Text>
      
      <Box marginTop={1} marginBottom={2}>
        <SelectInput
          items={AUTH_METHODS.map(method => ({
            ...method,
            key: method.value,
          })) as AuthMethodItem[]}
          onSelect={(item: AuthMethodItem) => {
            setSelectedMethod(item.value as AuthMethod);
            if (item.requiresInput) {
              setStep('input');
            } else {
              setStep('authenticating');
              startAuthFlow();
            }
          }}
          itemComponent={({ isSelected, label, item }: { isSelected: boolean, label: string, item: AuthMethodItem }) => (
            <Box>
              <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
              <Text>  </Text>
              <Text color="gray">{item.description}</Text>
            </Box>
          )}
        />
      </Box>
      
      <Text color="gray" italic>Use arrow keys to navigate, Enter to select, ESC to go back</Text>
    </Box>
  );

  const renderInputStep = () => {
    // In a real app, you'd have proper form handling for each auth method
    return (
      <Box flexDirection="column">
        <Text bold>Authentication Details</Text>
        <Text>Please provide the required information for {selectedMethod} authentication:</Text>
        
        <Box marginTop={1} marginBottom={2} flexDirection="column">
          <Box marginBottom={1}>
            <Text>Alias (optional): </Text>
            <TextInput
              value={alias}
              onChange={setAlias}
              placeholder="my-org-alias"
            />
          </Box>
          
          <Box marginBottom={2}>
            <Text>Username: </Text>
            <TextInput
              value={username}
              onChange={setUsername}
              placeholder="user@example.com"
            />
          </Box>
          
          {/* Additional fields would be rendered here based on auth method */}
          
          <Box flexDirection="column" marginTop={1}>
            <SelectInput
              items={[
                { label: 'Authenticate', value: 'auth' },
                { label: 'Back', value: 'back' },
              ]}
              onSelect={(item) => {
                if (item.value === 'auth') {
                  setStep('authenticating');
                  startAuthFlow();
                } else {
                  setStep('method');
                }
              }}
            />
          </Box>
        </Box>
        
        <Text color="gray" italic>ESC to go back</Text>
      </Box>
    );
  };

  const renderAuthenticatingStep = () => (
    <Box flexDirection="column">
      {isProcessing ? (
        <>
          <Text><Spinner type="dots" /> Authenticating...</Text>
          
          {authUrl && (
            <Box marginTop={1} marginBottom={1}>
              <Text>Please complete authentication in your browser:</Text>
              <Text color="cyan" underline>{authUrl}</Text>
            </Box>
          )}
          
          {deviceCode && (
            <Box marginTop={1} marginBottom={1}>
              <Text>Your device code: <Text bold>{deviceCode}</Text></Text>
            </Box>
          )}
          
          <Box marginTop={1} borderStyle="round" padding={1} height={10} overflow="hidden">
            <Text>{output || 'Starting authentication...'}</Text>
          </Box>
        </>
      ) : (
        <Text>Authentication complete!</Text>
      )}
    </Box>
  );

  const renderSuccessStep = () => (
    <Box flexDirection="column">
      <Text color="green">✓ Authentication successful!</Text>
      <Newline />
      <Text>You are now authenticated with Salesforce.</Text>
      {alias && <Text>Alias: <Text bold>{alias}</Text></Text>}
      <Newline />
      <Text>Press any key to continue...</Text>
    </Box>
  );

  const renderErrorStep = () => (
    <Box flexDirection="column">
      <Text color="red">✗ Authentication failed</Text>
      <Newline />
      <Text>Error: {error || 'Unknown error occurred'}</Text>
      <Newline />
      <Box borderStyle="round" padding={1} height={10} overflow="hidden">
        <Text>{output || 'No additional details available'}</Text>
      </Box>
      <Newline />
      <Text>Press any key to continue...</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>Salesforce Authentication</Text>
      </Box>
      
      {step === 'method' && renderMethodStep()}
      {step === 'input' && renderInputStep()}
      {step === 'authenticating' && renderAuthenticatingStep()}
      {step === 'success' && renderSuccessStep()}
      {step === 'error' && renderErrorStep()}
      
      {(step === 'success' || step === 'error') && (
        <Box marginTop={1}>
          <Text>Press any key to continue...</Text>
        </Box>
      )}
      
      {step !== 'success' && step !== 'error' && step !== 'authenticating' && (
        <Text color="gray" italic>
          ESC to go back
        </Text>
      )}
    </Box>
  );
};

export default AuthManager;
