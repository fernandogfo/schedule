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
import type { Category, EventWithTimers } from '../schemas/schedule';

interface CategoryPanelProps {
  category: Category;
  states: EventState[];
  collapsed: boolean;
  onToggle: () => void;
  onEdit: (event: EventWithTimers) => void;
}

export function CategoryPanel({
  category,
  states,
  collapsed,
  onToggle,
  onEdit,
}: CategoryPanelProps) {
  const color = getContrastText(category.color);
  const contentId = `category-${category.id}-events`;
  const toggleLabel = collapsed
    ? `Expand ${category.name}`
    : `Minimize ${category.name}`;

  return (
    <Paper className="event-list" elevation={3}>
      <Box
        className="category-header"
        sx={{ backgroundColor: category.color, color }}
        onClick={onToggle}
      >
        <Box
          component="img"
          src={`/assets/images/event_type/${category.icon}.png`}
          alt=""
          className="category-icon"
        />
        <Typography variant="subtitle1" className="title-text">
          {category.name}
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
              No events in this region.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
