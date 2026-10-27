import { useState, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { AlertMenu } from './AlertMenu';
import { CargoEditDialog } from './CargoEditDialog';
import { useSchedule } from '../state/ScheduleProvider';
import {
  getCargoPlan,
  getCargoShipPosition,
  getServer,
} from '../lib/cargo';
import {
  formatCountdown,
  formatDateTime,
  formatShipDuration,
} from '../lib/time';

export function CargoShipCard() {
  const {
    cargoShip,
    now,
    preferences,
    setPreferences,
  } = useSchedule();
  const [serverMenu, setServerMenu] = useState<HTMLElement | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  if (!cargoShip || !cargoShip.enabled) return null;

  const server = getServer(cargoShip, preferences.cargoServerId);
  const plan = getCargoPlan(cargoShip, server, now);
  const position = getCargoShipPosition(plan);
  const currentStep = plan.current?.step;
  const alertOptions = cargoShip.alerts.map((alert) => ({
    id: alert.id,
    name: alert.name,
  }));
  const shipStyle = currentStep
    ? position.docked
      ? position.reverse
        ? { left: '0%' }
        : { right: '0%' }
      : position.reverse
        ? { left: `${(1 - position.progress) * 100}%` }
        : { right: `${(1 - position.progress) * 100}%` }
    : undefined;

  const openServerMenu = (event: MouseEvent<HTMLElement>) =>
    setServerMenu(event.currentTarget);

  return (
    <>
      <Paper className="event-list cargo-ship" elevation={3}>
        <Box
          className="category-header cargo-header"
          sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}
        >
          <Box
            component="img"
            src="/assets/images/event_type/exploration.png"
            alt=""
            className="category-icon"
          />
          <Typography variant="subtitle1" className="title-text">
            [{server?.name ?? 'Select a server'}] Cargo Ship
          </Typography>
          <Box className="cargo-actions">
            <Tooltip title="Drag to reorder">
              <Box component="span" className="drag-handle" draggable>
                <DragIndicatorIcon fontSize="small" />
              </Box>
            </Tooltip>
            {server && (
              <AlertMenu
                alertKey={`cargo:${server.id}`}
                options={alertOptions}
                sampleText={`the cargo ship on ${server.name}`}
              />
            )}
            <Tooltip title="Change server">
              <IconButton
                size="small"
                color="inherit"
                onClick={openServerMenu}
                aria-label="Change cargo server"
              >
                <SwapHorizIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit cargo timer">
              <span>
                <IconButton
                  size="small"
                  color="inherit"
                  disabled={!server}
                  onClick={() => setEditOpen(true)}
                  aria-label="Edit cargo timer"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Box className="cargo-slider">
          <Box className="cargo-rail" />
          <Tooltip title="Solis Headlands Trade Outlet">
            <Box className="cargo-icon austera" />
          </Tooltip>
          <Tooltip title="Two Crowns Trade Outlet">
            <Box className="cargo-icon two-crowns" />
          </Tooltip>
          {currentStep && (
            <Box
              className={[
                'cargo-icon',
                'ship',
                currentStep.sailing ? 'moving' : '',
                position.reverse ? 'reverse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={shipStyle}
            />
          )}
        </Box>

        <Box className="cargo-text">
          {!server && (
            <Typography variant="body2">
              Select a server to see the cargo ship location.
            </Typography>
          )}
          {server && !server.timer && (
            <Typography variant="body2">
              The cargo ship timer has not been configured for this server.
            </Typography>
          )}
          {server && server.timer && plan.stale && (
            <>
              <Typography variant="body2">
                The cargo ship has not been updated since the last maintenance.
              </Typography>
              {plan.updatedAt && (
                <Typography variant="caption" color="text.secondary">
                  Last update: {plan.updatedAt.local().format('MMM D, YYYY h:mm A')}
                </Typography>
              )}
            </>
          )}
          {server && server.timer && !plan.stale && currentStep && (
            <>
              <Typography variant="body2">
                Cargo ship is {currentStep.text}.{' '}
                <strong>{formatShipDuration(plan.remainingSeconds)}</strong>{' '}
                remaining.
              </Typography>
              <Table size="small" stickyHeader className="timer-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Countdown</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.steps.slice(0, 4).map((step) => (
                    <TableRow key={`${step.step.id}-${step.start.toISOString()}`}>
                      <TableCell>{step.step.next}</TableCell>
                      <TableCell>{formatDateTime(step.end)}</TableCell>
                      <TableCell align="right">
                        {formatCountdown(step.end.diff(now))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </Box>
      </Paper>

      <Menu
        open={Boolean(serverMenu)}
        anchorEl={serverMenu}
        onClose={() => setServerMenu(null)}
      >
        {cargoShip.servers.map((item) => (
          <MenuItem
            key={item.id}
            selected={item.id === preferences.cargoServerId}
            onClick={() => {
              setPreferences((current) => ({
                ...current,
                cargoServerId: item.id,
              }));
              setServerMenu(null);
            }}
          >
            {item.name} ({item.region}){item.unchained ? ' · Unchained' : ''}
          </MenuItem>
        ))}
      </Menu>

      {server && (
        <CargoEditDialog
          key={server.id}
          open={editOpen}
          server={server}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
