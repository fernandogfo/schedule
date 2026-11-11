import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { AlertMenu } from './AlertMenu';
import { useSchedule } from '../state/ScheduleProvider';
import { formatCountdown, formatTimeOfDay } from '../lib/time';
import { getVyravaKey, type VyravaItemState } from '../lib/vyrava';
import type { VyravaSection } from '../schemas/schedule';

interface VyravaItemCardProps {
  state: VyravaItemState;
  section: VyravaSection;
}

export function VyravaItemCard({ state, section }: VyravaItemCardProps) {
  const { data, now, startVyravaTimer, isFavorite, toggleFavorite } =
    useSchedule();
  const { item, startedAt, end, remainingMs, counting, running } = state;
  const itemKey = getVyravaKey(item.id);
  const favorite = isFavorite(itemKey);
  const durationLabel = `${Math.round(section.durationSeconds / 3600)}h`;
  const countdown = counting ? formatCountdown(remainingMs) : '';
  const alertOptions = data?.alerts.options ?? [];

  let subtitle: string;
  if (running && end) {
    subtitle = `In progress since ${formatTimeOfDay(end, now)}`;
  } else if (counting && end) {
    subtitle = `Active at ${formatTimeOfDay(end, now)}`;
  } else {
    subtitle = `No countdown running. Start one for a ${durationLabel} countdown.`;
  }

  return (
    <Card className="event-card vyrava-item" elevation={0}>
      <Box
        className={['event-card-header', running ? 'running' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <Box className="event-avatar-wrap">
          <Avatar
            src={`/assets/images/event/${item.icon || 'event'}.png`}
            alt=""
            className="event-icon"
          >
            {item.name.charAt(0)}
          </Avatar>
        </Box>

        <Box className="event-card-main">
          <Typography variant="subtitle1" component="div" className="event-title">
            {item.name}
          </Typography>
          <Typography variant="caption" component="div" className="event-subtitle">
            {subtitle}
          </Typography>
        </Box>

        <Box className="event-card-actions">
          <Box className="event-countdown">
            {running && <span className="ev-status-in-progress" />}
            <Typography variant="caption">{countdown}</Typography>
          </Box>
          <Box className="event-buttons">
            <Tooltip
              title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <IconButton
                size="small"
                onClick={() => toggleFavorite(itemKey)}
                aria-label={
                  favorite ? 'Remove from favorites' : 'Add to favorites'
                }
                aria-pressed={favorite}
                color={favorite ? 'warning' : 'default'}
              >
                {favorite ? (
                  <StarIcon fontSize="small" />
                ) : (
                  <StarBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <AlertMenu
              alertKey={itemKey}
              options={alertOptions}
              sampleText={`the Vyrava in ${item.name}`}
            />
            <Button
              size="small"
              variant="contained"
              color="primary"
              className="vyrava-start-btn"
              onClick={() => startVyravaTimer(item.id)}
              aria-label={
                startedAt
                  ? `Restart ${durationLabel} countdown for ${item.name}`
                  : `Start ${durationLabel} countdown for ${item.name}`
              }
            >
              {startedAt ? `Restart ${durationLabel}` : `Start ${durationLabel}`}
            </Button>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
