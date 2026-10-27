import { useState, type MouseEvent } from 'react';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useSchedule } from '../state/ScheduleProvider';
import { useSpeech } from '../features/speech/SpeechProvider';

export interface AlertMenuOption {
  id: string;
  name: string;
}

interface AlertMenuProps {
  alertKey: string;
  options: AlertMenuOption[];
  sampleText: string;
  label?: string;
}

export function AlertMenu({
  alertKey,
  options,
  sampleText,
  label = 'Configure alerts',
}: AlertMenuProps) {
  const {
    alertSelections,
    toggleAlert,
    clearAlerts,
    speakSelections,
    setSpeaking,
  } = useSchedule();
  const { supported, speak } = useSpeech();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const selected = alertSelections[alertKey] ?? [];
  const speaking = speakSelections[alertKey] === true;

  const open = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget);
  const close = () => setAnchor(null);

  const toggleSpeech = () => {
    const next = !speaking;
    setSpeaking(alertKey, next);
    if (next) speak(`Audio messages enabled for ${sampleText}.`, true);
  };

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size="small"
          onClick={open}
          aria-label={label}
          color={selected.length > 0 ? 'primary' : 'inherit'}
        >
          <Badge
            badgeContent={selected.length}
            color="primary"
            overlap="circular"
            className={selected.length === 0 ? 'notif-fade' : undefined}
          >
            <NotificationsIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        slotProps={{ paper: { sx: { width: 320 } } }}
      >
        <Box className="alert-menu-header">
          <Typography variant="subtitle2">Alert types</Typography>
          <Tooltip title="Clear all">
            <span>
              <IconButton
                size="small"
                disabled={selected.length === 0}
                onClick={() => clearAlerts(alertKey)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <MenuItem dense disabled>
          <Checkbox size="small" checked disableRipple />
          <Typography variant="body2">Audio cue</Typography>
        </MenuItem>
        <MenuItem
          dense
          disabled={!supported}
          onClick={toggleSpeech}
          title={supported ? undefined : 'Speech synthesis is not available.'}
        >
          <Checkbox size="small" checked={speaking} disableRipple />
          <Typography variant="body2">Audio message</Typography>
        </MenuItem>
        <Box className="alert-menu-divider" />
        <Box className="alert-menu-header">
          <Typography variant="subtitle2">Alert times</Typography>
        </Box>
        {options.map((option) => (
          <MenuItem
            key={option.id}
            dense
            onClick={() => toggleAlert(alertKey, option.id)}
          >
            <Checkbox
              size="small"
              checked={selected.includes(option.id)}
              disableRipple
            />
            <Typography variant="body2">{option.name}</Typography>
          </MenuItem>
        ))}
        {options.length === 0 && (
          <MenuItem disabled dense>
            <Typography variant="body2">No alerts are configured.</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
