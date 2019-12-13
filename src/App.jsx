import './App.css';
import { PrimaryButton } from 'office-ui-fabric-react';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import React from 'react';

function App() {
  return (
    <Stack
      tokens={{ padding: 10 }}
      verticalAlign="center"
      style={{ height: '100vh' }}
    >
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <Stack.Item grow>
          <TextField placeholder="Youtube URL" />
        </Stack.Item>
        <Stack.Item>
          <PrimaryButton>yt2mp3</PrimaryButton>
        </Stack.Item>
      </Stack>
    </Stack>
  );
}

export default App;
