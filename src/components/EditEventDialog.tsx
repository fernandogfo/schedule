import { useState, type MouseEvent } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSchedule } from '../state/ScheduleProvider';
import { DAYS, DAY_ABBR, DAY_LABELS, REGIONS, type Day } from '../lib/constants';
import { parseTime } from '../lib/time';
import { timerSchema } from '../schemas/schedule';
import type {
  EventWithTimers,
  ScheduleTimer,
} from '../schemas/schedule';

interface EditEventDialogProps {
  open: boolean;
  event: EventWithTimers | null;
  isBaseEvent: boolean;
  onClose: () => void;
}

function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function emptyTimer(eventId: string): ScheduleTimer {
  return {
    id: createId('timer'),
    eventId,
    time: '12:00:00',
    days: [],
    messages: {},
  };
}

export function EditEventDialog({
  open,
  event,
  isBaseEvent,
  onClose,
}: EditEventDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    data,
    saveEvent,
    deleteEvent,
    restoreEvent,
    isEventOverridden,
  } = useSchedule();
  const icons = data?.meta.eventIcons ?? [];
  const categoryStartMessage = (categoryId: string) =>
    data?.categories.find((category) => category.id === categoryId)?.startMessage;
  const categoryReminderMessage = (categoryId: string) =>
    data?.categories.find((category) => category.id === categoryId)?.reminderMessage;

  const [form, setForm] = useState<EventWithTimers>(() => {
    if (event) {
      return {
        ...event,
        timers: event.timers.map((timer) => ({
          ...timer,
          days: [...timer.days],
          messages: { ...timer.messages },
        })),
      };
    }

    return {
      id: createId('event'),
      name: '',
      categoryId: data?.categories[0]?.id ?? '',
      icon: 'event',
      description: '',
      link: '',
      disabled: false,
      timers: [],
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [iconAnchor, setIconAnchor] = useState<HTMLElement | null>(null);
  const overridden = Boolean(event && isEventOverridden(event.id));

  const update = <Key extends keyof EventWithTimers>(
    key: Key,
    value: EventWithTimers[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateTimer = (index: number, patch: Partial<ScheduleTimer>) => {
    setForm((current) => ({
      ...current,
      timers: current.timers.map((timer, timerIndex) =>
        timerIndex === index ? { ...timer, ...patch } : timer,
      ),
    }));
  };

  const addTimer = () => {
    setForm((current) => ({
      ...current,
      timers: [...current.timers, emptyTimer(current.id)],
    }));
  };

  const removeTimer = (index: number) => {
    setForm((current) => ({
      ...current,
      timers: current.timers.filter((_, timerIndex) => timerIndex !== index),
    }));
  };

  const openIconPicker = (clickEvent: MouseEvent<HTMLElement>) => {
    setIconAnchor(clickEvent.currentTarget);
  };

  const submit = () => {
    setError(null);
    if (!form.name.trim()) {
      setError('Event name is required.');
      return;
    }
    if (!form.categoryId) {
      setError('Event type is required.');
      return;
    }
    if (!form.icon) {
      setError('Event icon is required.');
      return;
    }

    const cleanedTimers: ScheduleTimer[] = [];
    for (const timer of form.timers) {
      if (!parseTime(timer.time)) {
        setError('Every timer needs a valid start time.');
        return;
      }

      const cleaned: ScheduleTimer = {
        ...timer,
        eventId: form.id,
        region: timer.region || undefined,
        duration: timer.duration || undefined,
        label: timer.label?.trim() || undefined,
        inGameTime: timer.inGameTime || undefined,
        reminderTime: timer.reminderTime || undefined,
        days: timer.days.length === 7 ? [] : timer.days,
        messages: {
          start: timer.messages.start?.trim() || undefined,
          reminder: timer.messages.reminder?.trim() || undefined,
        },
      };
      const parsed = timerSchema.safeParse(cleaned);
      if (!parsed.success) {
        setError(
          `Timer ${cleanedTimers.length + 1}: ${parsed.error.issues[0]?.message ?? 'invalid values.'}`,
        );
        return;
      }
      cleanedTimers.push(parsed.data);
    }

    saveEvent({
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      link: form.link?.trim() || undefined,
      timers: cleanedTimers,
    });
    onClose();
  };

  const removeEvent = () => {
    if (!window.confirm(`Delete "${form.name}" from this browser?`)) return;
    deleteEvent(form.id);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle className="dialog-title">
        {event ? 'Edit Event' : 'New Event'}
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box className="event-form">
          <Box className="icon-picker">
            <Avatar
              variant="rounded"
              src={`/assets/images/event/${form.icon || 'event'}.png`}
              alt=""
              onClick={openIconPicker}
            >
              {form.name.charAt(0) || 'E'}
            </Avatar>
            <Box>
              <Typography variant="body2">{form.icon}</Typography>
              <Button size="small" onClick={openIconPicker}>
                Choose icon
              </Button>
            </Box>
          </Box>

          <TextField
            required
            label="Event name"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
          />

          <FormControl required>
            <InputLabel id="event-category-label">Type</InputLabel>
            <Select
              labelId="event-category-label"
              label="Type"
              value={form.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
            >
              {(data?.categories ?? []).map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Link"
            value={form.link ?? ''}
            onChange={(event) => update('link', event.target.value)}
            placeholder="https://..."
          />

          <TextField
            label="Description"
            value={form.description ?? ''}
            onChange={(event) => update('description', event.target.value)}
            multiline
            minRows={2}
            className="event-description-field"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.disabled}
                onChange={(event) => update('disabled', event.target.checked)}
              />
            }
            label="Disabled"
          />
        </Box>

        <Box className="timers-heading">
          <Box>
            <Typography variant="subtitle2">Times</Typography>
            <Typography variant="caption" color="text.secondary">
              Times are entered in UTC. Leave days empty to repeat every day.
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} onClick={addTimer} variant="outlined" size="small">
            Add time
          </Button>
        </Box>

        {form.timers.length === 0 && (
          <Typography variant="body2" color="text.secondary" className="no-timers">
            No times configured. The event will not appear in the countdown list.
          </Typography>
        )}

        <Stack spacing={2}>
          {form.timers.map((timer, index) => (
            <Box component="fieldset" className="timer-editor" key={timer.id}>
              <Box className="timer-editor-header">
                <Typography variant="subtitle2">Time {index + 1}</Typography>
                <Tooltip title="Remove time">
                  <IconButton
                    size="small"
                    onClick={() => removeTimer(index)}
                    aria-label="Remove time"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box className="timer-grid">
                <FormControl>
                  <InputLabel id={`region-${timer.id}`}>Region</InputLabel>
                  <Select
                    labelId={`region-${timer.id}`}
                    label="Region"
                    value={timer.region ?? ''}
                    onChange={(event) => {
                      const value = event.target.value as string;
                      updateTimer(index, {
                        region:
                          value === ''
                            ? undefined
                            : (value as (typeof REGIONS)[number]),
                      });
                    }}
                  >
                    <MenuItem value="">All regions</MenuItem>
                    {REGIONS.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  required
                  type="time"
                  label="Start time"
                  value={timer.time}
                  onChange={(event) =>
                    updateTimer(index, { time: event.target.value })
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { step: 1 },
                  }}
                />

                <TextField
                  type="time"
                  label="Duration"
                  value={timer.duration ?? ''}
                  onChange={(event) =>
                    updateTimer(index, {
                      duration: event.target.value || undefined,
                    })
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { step: 1 },
                  }}
                />

                <TextField
                  type="time"
                  label="In-game time"
                  value={timer.inGameTime ?? ''}
                  onChange={(event) =>
                    updateTimer(index, {
                      inGameTime: event.target.value || undefined,
                      region: event.target.value ? undefined : timer.region,
                    })
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { step: 1 },
                  }}
                />

                <TextField
                  label="Name or label"
                  value={timer.label ?? ''}
                  onChange={(event) =>
                    updateTimer(index, {
                      label: event.target.value || undefined,
                    })
                  }
                  placeholder="Optional label"
                />

                <TextField
                  type="time"
                  label="Reminder override"
                  value={timer.reminderTime ?? ''}
                  onChange={(event) =>
                    updateTimer(index, {
                      reminderTime: event.target.value || undefined,
                    })
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { step: 1 },
                  }}
                />
              </Box>

              <FormControl className="day-select">
                <InputLabel id={`days-${timer.id}`}>Days</InputLabel>
                <Select<Day[]>
                  multiple
                  labelId={`days-${timer.id}`}
                  label="Days"
                  value={timer.days}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateTimer(index, {
                      days: DAYS.filter((day) => value.includes(day)),
                    });
                  }}
                  renderValue={(selected) =>
                    selected.length === 0 ? 'Every day' : (
                      <Box className="day-chips">
                        {selected.map((day) => (
                          <Chip
                            key={day}
                            size="small"
                            label={DAY_ABBR[day]}
                            className="day-chip"
                          />
                        ))}
                      </Box>
                    )
                  }
                >
                  {DAYS.map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox size="small" checked={timer.days.includes(day)} />
                      <ListItemText primary={DAY_LABELS[day]} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box className="timer-messages">
                <TextField
                  label="Start message"
                  value={timer.messages.start ?? ''}
                  onChange={(event) =>
                    updateTimer(index, {
                      messages: {
                        ...timer.messages,
                        start: event.target.value || undefined,
                      },
                    })
                  }
                  placeholder={
                    categoryStartMessage(form.categoryId) ||
                    'Alternate message when this event starts.'
                  }
                  multiline
                />
                <TextField
                  label="Reminder message"
                  value={timer.messages.reminder ?? ''}
                  onChange={(event) =>
                    updateTimer(index, {
                      messages: {
                        ...timer.messages,
                        reminder: event.target.value || undefined,
                      },
                    })
                  }
                  placeholder={
                    categoryReminderMessage(form.categoryId) ||
                    'Alternate message before this event starts.'
                  }
                  multiline
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Message tokens: {'{event}'}, {'{time}'}, {'{duration}'},{' '}
                {'{remaining}'}, {'{label}'}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions className="edit-dialog-actions">
        <Box className="edit-dialog-left">
          {event && (
            <Button color="error" onClick={removeEvent}>
              Delete
            </Button>
          )}
          {event && isBaseEvent && overridden && (
            <Button
              onClick={() => {
                restoreEvent(event.id);
                onClose();
              }}
            >
              Restore remote data
            </Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={submit}>
            Save
          </Button>
        </Box>
      </DialogActions>

      <Popover
        open={Boolean(iconAnchor)}
        anchorEl={iconAnchor}
        onClose={() => setIconAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box className="avatar-select">
          {(icons.length > 0 ? icons : ['event']).map((icon) => (
            <Tooltip title={icon} key={icon}>
              <Avatar
                src={`/assets/images/event/${icon}.png`}
                alt={icon}
                onClick={() => {
                  update('icon', icon);
                  setIconAnchor(null);
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Popover>
    </Dialog>
  );
}
