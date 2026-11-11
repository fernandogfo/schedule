import { useState, type MouseEvent } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WebhookIcon from '@mui/icons-material/Webhook';
import { useSchedule } from '../state/ScheduleProvider';
import { DiscordUrlField } from './DiscordUrlField';

interface DiscordWebhookMenuProps {
  categoryKey: string;
  label: string;
}

export function DiscordWebhookMenu({ categoryKey, label }: DiscordWebhookMenuProps) {
  const { discordWebhooks, setCategoryWebhook } = useSchedule();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const url = discordWebhooks.categories[categoryKey] ?? '';

  const open = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size="small"
          color="inherit"
          onClick={open}
          aria-label={label}
          aria-haspopup="dialog"
        >
          <WebhookIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, width: 300 } } }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Discord webhook
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          component="p"
          gutterBottom
        >
          Notifications from this panel are sent to this URL.
        </Typography>
        <DiscordUrlField
          value={url}
          onChange={(next) => setCategoryWebhook(categoryKey, next)}
          label="Panel webhook URL"
        />
      </Popover>
    </>
  );
}
