import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { isDiscordWebhookUrl } from '../lib/discord';
import { sendDiscordTestMessage } from '../services/discordService';

interface DiscordUrlFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export function DiscordUrlField({
  value,
  onChange,
  label = 'Discord webhook URL',
  helperText,
}: DiscordUrlFieldProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'failed' | null>(null);
  const [syncedValue, setSyncedValue] = useState(value);

  if (syncedValue !== value) {
    setSyncedValue(value);
    setDraft(value);
    setError(false);
    setTestResult(null);
  }

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      setError(false);
      onChange('');
      return;
    }
    if (isDiscordWebhookUrl(trimmed)) {
      setError(false);
      onChange(trimmed);
    } else {
      setError(true);
    }
  };

  const runTest = async () => {
    const trimmed = draft.trim();
    if (!isDiscordWebhookUrl(trimmed)) {
      setError(true);
      return;
    }
    onChange(trimmed);
    setTesting(true);
    setTestResult(null);
    const ok = await sendDiscordTestMessage(trimmed);
    setTesting(false);
    setTestResult(ok ? 'ok' : 'failed');
  };

  return (
    <Box>
      <TextField
        size="small"
        fullWidth
        label={label}
        placeholder="https://discord.com/api/webhooks/…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        error={error}
        helperText={
          error
            ? 'Enter a valid Discord webhook URL (https://discord.com/api/webhooks/…).'
            : helperText
        }
      />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          disabled={testing || draft.trim().length === 0}
          onClick={() => void runTest()}
        >
          {testing ? 'Sending…' : 'Send test'}
        </Button>
        {testResult && (
          <Typography
            variant="caption"
            color={testResult === 'ok' ? 'success.main' : 'error.main'}
          >
            {testResult === 'ok' ? 'Message sent!' : 'Send failed.'}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
