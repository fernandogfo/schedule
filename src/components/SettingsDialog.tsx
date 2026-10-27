import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useSchedule } from '../state/ScheduleProvider';
import { useSpeech } from '../features/speech/SpeechProvider';
import { useAudioCues } from '../features/audio/AudioProvider';
import { REGIONS } from '../lib/constants';
import { xttsAvailable, xttsCheckHealth } from '../services/xttsService';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type XttsStatus = 'idle' | 'checking' | 'online' | 'offline';

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    data,
    preferences,
    setPreferences,
    resetPreferences,
    resetOverrides,
    overrides,
    reload,
    source,
    warning,
  } = useSchedule();
  const { supported, xttsActive, staticClipsCount, voices, selectedVoice, speak } = useSpeech();
  const { testAudio } = useAudioCues();

  const [xttsStatus, setXttsStatus] = useState<XttsStatus>('idle');

  useEffect(() => {
    if (!open || !xttsAvailable) return;
    setXttsStatus('checking');
    void xttsCheckHealth().then(({ ok, modelLoaded }) => {
      setXttsStatus(ok && modelLoaded ? 'online' : 'offline');
    });
  }, [open]);

  if (!data) return null;

  const updateTts = (patch: Partial<typeof preferences.tts>) => {
    setPreferences((current) => ({
      ...current,
      tts: { ...current.tts, ...patch },
    }));
  };

  const resetLocalChanges = () => {
    if (
      window.confirm(
        'Reset all locally edited events and cargo timers? Remote data will be shown again.',
      )
    ) {
      resetOverrides();
    }
  };

  const resetAllPreferences = () => {
    if (window.confirm('Reset preferences and alert selections?')) {
      resetPreferences();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle className="dialog-title">
        Settings
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2" className="settings-section-title">
              Display
            </Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel id="settings-region">Region</InputLabel>
              <Select
                labelId="settings-region"
                label="Region"
                value={preferences.region}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    region: event.target.value as (typeof REGIONS)[number],
                  }))
                }
              >
                {REGIONS.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.showDisabled}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      showDisabled: event.target.checked,
                    }))
                  }
                />
              }
              label="Show disabled events"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.darkMode}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      darkMode: event.target.checked,
                    }))
                  }
                />
              }
              label="Dark mode"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" className="settings-section-title">
              Alert audio
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Volume: {preferences.volume}%
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <VolumeUpIcon color="action" />
              <Slider
                value={preferences.volume}
                onChange={(_, value) =>
                  setPreferences((current) => ({
                    ...current,
                    volume: Array.isArray(value) ? value[0] : value,
                  }))
                }
                onChangeCommitted={() => testAudio()}
                min={0}
                max={100}
                step={5}
                aria-label="Alert volume"
              />
              <Button size="small" onClick={testAudio}>
                Test
              </Button>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" className="settings-section-title">
              Spoken messages
            </Typography>

            {/* ── Pre-generated static clips (Priority 1) ─────────── */}
            {staticClipsCount > 0 ? (
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Backend:
                  </Typography>
                  <Chip
                    size="small"
                    icon={<CheckCircleIcon />}
                    label={`XTTS Static Voice (${staticClipsCount} clips)`}
                    color="success"
                    variant="outlined"
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Voice messages are played offline directly from pre-generated XTTS audio files. No Python server required.
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      speak(
                        'Abyssal Attack will start in 1 minute.',
                        true,
                      )
                    }
                  >
                    Test static voice
                  </Button>
                </Stack>
              </Stack>
            ) : xttsActive ? (
              /* ── XTTS server fallback ───────────────────────────────── */
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Backend:
                  </Typography>
                  {xttsStatus === 'checking' && (
                    <Chip
                      size="small"
                      icon={<CircularProgress size={12} />}
                      label="Checking XTTS server…"
                      variant="outlined"
                    />
                  )}
                  {xttsStatus === 'online' && (
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon />}
                      label="XTTS-v2 online"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {xttsStatus === 'offline' && (
                    <Chip
                      size="small"
                      icon={<ErrorIcon />}
                      label="XTTS server offline"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  {xttsStatus === 'idle' && (
                    <Chip size="small" label="XTTS-v2" variant="outlined" />
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Voice synthesis is handled by your local XTTS-v2 server.
                  Audio is generated once and cached — no internet required.
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={xttsStatus !== 'online'}
                    onClick={() =>
                      speak(
                        'The cargo ship will arrive at Solis Headlands in three minutes.',
                        true,
                      )
                    }
                  >
                    Test XTTS voice
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setXttsStatus('checking');
                      void xttsCheckHealth().then(({ ok, modelLoaded }) =>
                        setXttsStatus(ok && modelLoaded ? 'online' : 'offline'),
                      );
                    }}
                  >
                    Recheck
                  </Button>
                </Stack>
              </Stack>
            ) : (
              /* ── Browser SpeechSynthesis fallback ──────────────── */
              <>
                {!supported && (
                  <Typography variant="body2" color="warning.main" gutterBottom>
                    Speech synthesis is not available in this browser.
                  </Typography>
                )}
                <FormControl fullWidth margin="dense" disabled={!supported}>
                  <InputLabel id="settings-voice">Voice</InputLabel>
                  <Select
                    labelId="settings-voice"
                    label="Voice"
                    value={preferences.tts.voiceURI}
                    onChange={(event) => updateTts({ voiceURI: event.target.value })}
                  >
                    <MenuItem value="">
                      Automatic{selectedVoice ? ` — ${selectedVoice.name}` : ''}
                    </MenuItem>
                    {voices.map((voice) => (
                      <MenuItem key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  Speed: {preferences.tts.rate.toFixed(2)}
                </Typography>
                <Slider
                  value={preferences.tts.rate}
                  onChange={(_, value) =>
                    updateTts({ rate: Array.isArray(value) ? value[0] : value })
                  }
                  min={0.5}
                  max={2}
                  step={0.05}
                  disabled={!supported}
                  aria-label="Speech speed"
                />
                <Typography variant="body2" color="text.secondary">
                  Pitch: {preferences.tts.pitch.toFixed(2)}
                </Typography>
                <Slider
                  value={preferences.tts.pitch}
                  onChange={(_, value) =>
                    updateTts({ pitch: Array.isArray(value) ? value[0] : value })
                  }
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={!supported}
                  aria-label="Speech pitch"
                />
                <Typography variant="body2" color="text.secondary">
                  Speech volume: {Math.round(preferences.tts.volume * 100)}%
                </Typography>
                <Slider
                  value={preferences.tts.volume}
                  onChange={(_, value) =>
                    updateTts({ volume: Array.isArray(value) ? value[0] : value })
                  }
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!supported}
                  aria-label="Speech volume"
                />
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!supported}
                  onClick={() =>
                    speak(
                      'The cargo ship will arrive at Solis Headlands in three minutes.',
                      true,
                    )
                  }
                >
                  Test voice
                </Button>
              </>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" className="settings-section-title">
              Cargo ship
            </Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel id="settings-cargo-server">Cargo server</InputLabel>
              <Select
                labelId="settings-cargo-server"
                label="Cargo server"
                value={preferences.cargoServerId}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    cargoServerId: event.target.value,
                  }))
                }
              >
                {data.cargoShip.servers.map((server) => (
                  <MenuItem key={server.id} value={server.id}>
                    {server.name} ({server.region})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" className="settings-section-title">
              Schedule data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source:{' '}
              {source.startsWith('http') ? (
                <a href={source} target="_blank" rel="noreferrer">
                  {source}
                </a>
              ) : (
                <code>{source}</code>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.events.length} events · {data.timers.length} timers ·{' '}
              {data.categories.length} categories
            </Typography>
            {data.meta.updatedAt && (
              <Typography variant="body2" color="text.secondary">
                Data updated: {new Date(data.meta.updatedAt).toLocaleString()}
              </Typography>
            )}
            {warning && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                {warning}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Button size="small" startIcon={<RefreshIcon />} onClick={() => void reload()}>
                Reload schedule
              </Button>
              <Button size="small" color="warning" onClick={resetLocalChanges}>
                Reset local edits
              </Button>
              <Button size="small" color="warning" onClick={resetAllPreferences}>
                Reset preferences
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" component="p">
              Local edits: {Object.keys(overrides.events).length} events,{' '}
              {Object.keys(overrides.cargoServers).length} cargo timers.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
