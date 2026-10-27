import { useState, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useSchedule } from '../state/ScheduleProvider';
import { useAudioCues } from '../features/audio/AudioProvider';

export function VolumeControl() {
  const { preferences, setPreferences } = useSchedule();
  const { testAudio } = useAudioCues();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
  };

  const setVolume = (value: number) => {
    setPreferences((current) => ({ ...current, volume: value }));
  };

  return (
    <>
      <Tooltip title="Alert volume">
        <IconButton color="inherit" onClick={open} aria-label="Alert volume">
          {preferences.volume > 0 ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box className="volume-popover">
          <Typography variant="caption">{preferences.volume}%</Typography>
          <Slider
            orientation="vertical"
            value={preferences.volume}
            onChange={(_, value) => setVolume(Array.isArray(value) ? value[0] : value)}
            onChangeCommitted={() => testAudio()}
            min={0}
            max={100}
            step={5}
            aria-label="Alert volume"
            sx={{ height: 180 }}
          />
          <VolumeUpIcon fontSize="small" />
        </Box>
      </Popover>
    </>
  );
}
