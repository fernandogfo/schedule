import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EventCard } from './EventCard';
import { getContrastText } from '../lib/color';
import type { EventState } from '../lib/schedule';
import type { EventWithTimers } from '../schemas/schedule';

interface EventListPanelProps {
  panelId: string;
  title: string;
  icon: ReactNode;
  color: string;
  states: EventState[];
  collapsed: boolean;
  onToggle: () => void;
  onEdit: (event: EventWithTimers) => void;
  emptyMessage: string;
}

export function EventListPanel({
  panelId,
  title,
  icon,
  color,
  states,
  collapsed,
  onToggle,
  onEdit,
  emptyMessage,
}: EventListPanelProps) {
  const contentId = `panel-${panelId}-events`;
  const toggleLabel = collapsed
    ? `Expand ${title}`
    : `Minimize ${title}`;

  return (
    <Paper className="event-list" elevation={3}>
      <Box
        className="category-header"
        sx={{ backgroundColor: color, color: getContrastText(color) }}
        onClick={onToggle}
      >
        <Box className="special-panel-icon">{icon}</Box>
        <Typography variant="subtitle1" className="title-text">
          {title}
        </Typography>
        <Typography variant="caption" className="category-count">
          {states.length}
        </Typography>
        <Tooltip title="Drag to reorder">
          <Box
            component="span"
            className="drag-handle"
            draggable
            onClick={(event) => event.stopPropagation()}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        </Tooltip>
        <Tooltip title={toggleLabel}>
          <IconButton
            size="small"
            color="inherit"
            className="category-toggle"
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            <ExpandMoreIcon
              fontSize="small"
              className={`rotate-btn${collapsed ? ' rotated' : ''}`}
            />
          </IconButton>
        </Tooltip>
      </Box>
      <Collapse in={!collapsed} timeout="auto" unmountOnExit>
        <Box className="category-events" id={contentId}>
          {states.map((state) => (
            <EventCard key={state.event.id} state={state} onEdit={onEdit} />
          ))}
          {states.length === 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              className="empty-category"
              component="div"
            >
              {emptyMessage}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
