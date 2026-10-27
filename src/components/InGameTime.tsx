import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { useSchedule } from '../state/ScheduleProvider';
import { getInGameTime } from '../lib/time';

export function InGameTime() {
  const { data, now } = useSchedule();
  if (!data) return null;
  const time = getInGameTime(now, data.settings.inGame);

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2">In-Game Time</Typography>
          <Typography variant="caption" component="p">
            This is an estimate. Servers may vary by a minute.
          </Typography>
          <Typography variant="caption" component="p">
            Each in-game hour lasts 10 real minutes, so a full in-game day takes
            4 real hours.
          </Typography>
        </Box>
      }
    >
      <Box className="in-game-time" component="span">
        <span className="clock-icon" aria-hidden="true" />
        <Typography variant="body2" component="span">
          {time}
        </Typography>
      </Box>
    </Tooltip>
  );
}
