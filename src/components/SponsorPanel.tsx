import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSchedule } from '../state/ScheduleProvider';
import { getContrastText } from '../lib/color';
import { buildSponsorEmbedUrl, pickSponsorStream } from '../lib/sponsors';

interface SponsorPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SponsorPanel({ collapsed, onToggle }: SponsorPanelProps) {
  const { data } = useSchedule();
  const sponsors = data?.sponsors;
  const streams = useMemo(() => sponsors?.streams ?? [], [sponsors?.streams]);
  const [randomSeed] = useState(() => Math.random());
  const selected = useMemo(
    () => pickSponsorStream(streams, () => randomSeed),
    [randomSeed, streams],
  );

  if (!sponsors) return null;

  const embedUrl = selected
    ? buildSponsorEmbedUrl(selected, window.location.hostname)
    : '';
  const contentId = 'sponsor-stream';
  const toggleLabel = collapsed ? 'Expand Sponsor' : 'Minimize Sponsor';
  const color = getContrastText(sponsors.color);

  return (
    <Paper className="event-list sponsor-panel" elevation={3}>
      <Box
        className="category-header sponsor-header"
        sx={{ backgroundColor: sponsors.color, color }}
        onClick={onToggle}
      >
        <Box
          component="img"
          src={`/assets/images/event_type/${sponsors.icon}.png`}
          alt=""
          className="category-icon"
        />
        <Typography variant="subtitle1" className="title-text">
          {sponsors.title}
        </Typography>
        <Typography variant="caption" className="category-count">
          {streams.length}
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
        <Box className="sponsor-body" id={contentId}>
          {selected ? (
            <>
              <Box className="sponsor-embed">
                <iframe
                  key={selected.id}
                  src={embedUrl}
                  title={selected.name}
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                />
              </Box>
              <Box className="sponsor-footer">
                <Typography variant="body2" className="sponsor-name">
                  {selected.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selected.provider === 'twitch' ? 'Twitch' : 'YouTube'}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              className="empty-category"
              component="div"
            >
              No sponsors configured.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
