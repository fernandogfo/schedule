import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EventNoteIcon from '@mui/icons-material/EventNote';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useSchedule } from '../state/ScheduleProvider';
import { REGIONS } from '../lib/constants';
import { InGameTime } from './InGameTime';
import { VolumeControl } from './VolumeControl';

interface ScheduleToolbarProps {
  onAddEvent: () => void;
  onOpenSettings: () => void;
}

export function ScheduleToolbar({
  onAddEvent,
  onOpenSettings,
}: ScheduleToolbarProps) {
  const {
    data,
    loading,
    preferences,
    setPreferences,
    reload,
  } = useSchedule();

  return (
    <AppBar position="static" className="schedule-appbar" elevation={3}>
      <Toolbar className="schedule-toolbar">
        <Box className="toolbar-title">
          <EventNoteIcon />
          <Box>
            <Typography variant="h6" component="h1">
              {data?.meta.title ?? 'Event Schedule'}
            </Typography>
            <Typography variant="caption" component="div" className="toolbar-subtitle">
              Timers, world bosses, events and cargo ship
            </Typography>
          </Box>
        </Box>

        <Box className="toolbar-controls">
          <FormControl size="small" className="region-select">
            <Select
              value={preferences.region}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  region: event.target.value as (typeof REGIONS)[number],
                }))
              }
              inputProps={{ 'aria-label': 'Region' }}
              variant="standard"
              disableUnderline
              sx={{
                color: 'inherit',
                fontSize: '0.875rem',
                '& .MuiSvgIcon-root': { color: 'inherit' },
              }}
            >
              {REGIONS.map((region) => (
                <MenuItem key={region} value={region}>
                  {region}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <InGameTime />

          <Tooltip
            title={
              preferences.showDisabled
                ? 'Hide disabled events'
                : 'Show disabled events'
            }
          >
            <IconButton
              color="inherit"
              onClick={() =>
                setPreferences((current) => ({
                  ...current,
                  showDisabled: !current.showDisabled,
                }))
              }
              aria-label="Toggle disabled events"
            >
              {preferences.showDisabled ? (
                <VisibilityIcon />
              ) : (
                <VisibilityOffIcon />
              )}
            </IconButton>
          </Tooltip>

          <VolumeControl />

          <Tooltip title="Settings">
            <IconButton
              color="inherit"
              onClick={onOpenSettings}
              aria-label="Settings"
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reload schedule">
            <span>
              <IconButton
                color="inherit"
                onClick={() => void reload()}
                disabled={loading}
                aria-label="Reload schedule"
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>

          <Button
            startIcon={<AddIcon />}
            onClick={onAddEvent}
            className="add-event-button"
          >
            Add event
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
