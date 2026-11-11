import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { VyravaItemCard } from './VyravaItemCard';
import { getContrastText } from '../lib/color';
import { getVyravaItemStates } from '../lib/vyrava';
import { useSchedule } from '../state/ScheduleProvider';

interface VyravaPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function VyravaPanel({ collapsed, onToggle }: VyravaPanelProps) {
  const { data, now, vyravaTimers } = useSchedule();

  if (!data || !data.vyrava.enabled) return null;

  const section = data.vyrava;
  const states = getVyravaItemStates(section, vyravaTimers, now);
  const contentId = 'vyrava-items';
  const toggleLabel = collapsed
    ? `Expand ${section.title}`
    : `Minimize ${section.title}`;

  return (
    <Paper className="event-list" elevation={3}>
      <Box
        className="category-header"
        sx={{ backgroundColor: section.color, color: getContrastText(section.color) }}
        onClick={onToggle}
      >
        <Box
          component="img"
          src={`/assets/images/event_type/${section.icon}.png`}
          alt=""
          className="category-icon"
        />
        <Typography variant="subtitle1" className="title-text">
          {section.title}
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
            <VyravaItemCard key={state.item.id} state={state} section={section} />
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
}
