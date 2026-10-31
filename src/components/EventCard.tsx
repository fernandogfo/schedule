import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { AlertMenu } from './AlertMenu';
import { useSchedule } from '../state/ScheduleProvider';
import {
  getDaysBadge,
  getEventUpcomingOccurrences,
  type EventState,
} from '../lib/schedule';
import {
  formatCountdown,
  formatDateTime,
  formatTimeOfDay,
} from '../lib/time';
import type { EventWithTimers } from '../schemas/schedule';

interface EventCardProps {
  state: EventState;
  onEdit: (event: EventWithTimers) => void;
}

export function EventCard({ state, onEdit }: EventCardProps) {
  const { data, now, preferences, isFavorite, toggleFavorite } = useSchedule();
  const [expanded, setExpanded] = useState(false);
  const { event, active, next, running, target } = state;
  const favorite = isFavorite(event.id);
  const currentTimer = active?.timer ?? next?.timer;
  const gameTime = (active?.timer.inGameTime ?? next?.timer.inGameTime)?.slice(0, 5);
  const title = `${event.name}${currentTimer?.label ? `: ${currentTimer.label}` : ''}`;
  const dayBadge = getDaysBadge(next ?? active);
  const remaining = target ? formatCountdown(target.diff(now)) : '';
  const occurrences = getEventUpcomingOccurrences(
    event,
    now,
    preferences.region,
  );
  const externalLink =
    event.link && /^https?:\/\//i.test(event.link) ? event.link : null;
  const alertOptions = data?.alerts.options ?? [];

  const titleNode = externalLink ? (
    <a href={externalLink} target="_blank" rel="noreferrer">
      {title}
    </a>
  ) : (
    title
  );

  return (
    <Card className="event-card" elevation={0}>
      <Box
        className={[
          'event-card-header',
          running ? 'running' : '',
          event.disabled ? 'disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Box className="event-avatar-wrap">
          {dayBadge && (
            <Tooltip title={dayBadge.charAt(0) + dayBadge.slice(1).toLowerCase()}>
              <Box className={`ev-day day-${dayBadge}`} />
            </Tooltip>
          )}
          <Avatar
            src={`/assets/images/event/${event.icon || 'event'}.png`}
            alt=""
            className="event-icon"
          >
            {event.name.charAt(0)}
          </Avatar>
        </Box>

        <Box className="event-card-main">
          <Typography variant="subtitle1" component="div" className="event-title">
            {titleNode}
          </Typography>
          {running && active ? (
            <Typography variant="caption" component="div" className="event-subtitle">
              Running until {formatTimeOfDay(active.end, now)}
              {gameTime ? ` [${gameTime}]` : ''}
            </Typography>
          ) : next ? (
            <Typography variant="caption" component="div" className="event-subtitle">
              Next: {formatTimeOfDay(next.start, now)}
              {gameTime ? ` [${gameTime}]` : ''}
            </Typography>
          ) : (
            <Typography variant="caption" component="div" className="event-subtitle">
              No upcoming times for this region.
            </Typography>
          )}
          {running && next && (
            <Typography variant="caption" component="div" className="event-subtitle next-line">
              Next: {formatTimeOfDay(next.start, now)}
            </Typography>
          )}
        </Box>

        <Box className="event-card-actions">
          <Box className="event-countdown">
            {running && <span className="ev-status-in-progress" />}
            <Typography variant="caption">{remaining}</Typography>
          </Box>
          <Box className="event-buttons">
            {externalLink && (
              <Tooltip title="Open forum guide">
                <IconButton
                  size="small"
                  component="a"
                  href={externalLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open forum guide"
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip
              title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <IconButton
                size="small"
                onClick={() => toggleFavorite(event.id)}
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
              alertKey={event.id}
              options={alertOptions}
              sampleText={event.name}
            />
            <Tooltip title="Edit event">
              <IconButton size="small" onClick={() => onEdit(event)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="See more times">
              <IconButton size="small" onClick={() => setExpanded((value) => !value)}>
                <ExpandMoreIcon
                  fontSize="small"
                  className={`rotate-btn${expanded ? ' rotated' : ''}`}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent className="event-details">
          {event.description && (
            <Typography variant="body2" className="event-description">
              {event.description}
            </Typography>
          )}
          {next?.timer.inGameTime && (
            <Typography variant="body2" className="event-game-time-note">
              The next occurrence is at the in-game time of{' '}
              {next.timer.inGameTime.slice(0, 5)}.
            </Typography>
          )}
          {occurrences.length > 0 ? (
            <Table size="small" stickyHeader className="timer-table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Countdown</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {occurrences.map((occurrence) => (
                  <TableRow
                    key={`${occurrence.timer.id}-${occurrence.start.toISOString()}`}
                  >
                    <TableCell>{formatDateTime(occurrence.start)}</TableCell>
                    <TableCell>
                      {occurrence.timer.label || occurrence.timer.region || 'All regions'}
                    </TableCell>
                    <TableCell align="right">
                      {formatCountdown(occurrence.start.diff(now))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No upcoming occurrences in the selected region.
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" component="p">
            Times are shown in your local timezone.
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
}
