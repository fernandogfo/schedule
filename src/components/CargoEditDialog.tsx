import { useState } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { useSchedule } from '../state/ScheduleProvider';
import { createCargoTimer } from '../lib/cargo';
import type { CargoServer } from '../schemas/schedule';

interface CargoEditDialogProps {
  open: boolean;
  server: CargoServer;
  onClose: () => void;
}

function clampNumber(value: string, max: number): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned === '') return '';
  return String(Math.min(Number(cleaned), max));
}

export function CargoEditDialog({
  open,
  server,
  onClose,
}: CargoEditDialogProps) {
  const { data, now, saveCargoTimer } = useSchedule();
  const routePort = data?.cargoShip.route.find((step) => step.port)?.port ?? '';
  const initialTimer = server.timer;
  const [port, setPort] = useState(initialTimer?.port ?? routePort);
  const [minutes, setMinutes] = useState(
    initialTimer ? String(Math.floor(initialTimer.remainingSeconds / 60)) : '20',
  );
  const [seconds, setSeconds] = useState(
    initialTimer ? String(initialTimer.remainingSeconds % 60) : '0',
  );
  const [noLinkedUpdate, setNoLinkedUpdate] = useState(
    initialTimer?.noLinkedUpdate ?? false,
  );
  const ports = Object.entries(data?.cargoShip.ports ?? {});
  const canSave =
    Boolean(port) && (minutes.trim() !== '' || seconds.trim() !== '');

  const submit = () => {
    saveCargoTimer(
      server.id,
      createCargoTimer(
        port,
        Number(minutes || 0),
        Number(seconds || 0),
        noLinkedUpdate,
        now,
      ),
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="dialog-title">
        Cargo Ship Setup — {server.name}
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The ship must currently be docked at a port. Enter the remaining time
          shown on the &quot;Cargo Ship Anchored&quot; buff.
        </Typography>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="cargo-port-label">Docked port</InputLabel>
            <Select
              labelId="cargo-port-label"
              label="Docked port"
              value={port}
              onChange={(event) => setPort(event.target.value)}
            >
              {ports.map(([portId, portName]) => (
                <MenuItem key={portId} value={portId}>
                  {portName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Minutes"
              type="number"
              value={minutes}
              onChange={(event) => setMinutes(clampNumber(event.target.value, 999))}
              slotProps={{
                htmlInput: { min: 0, max: 999, inputMode: 'numeric' },
              }}
              fullWidth
            />
            <TextField
              label="Seconds"
              type="number"
              value={seconds}
              onChange={(event) => setSeconds(clampNumber(event.target.value, 59))}
              slotProps={{
                htmlInput: { min: 0, max: 59, inputMode: 'numeric' },
              }}
              fullWidth
            />
          </Stack>
          <FormControlLabel
            control={
              <Checkbox
                checked={noLinkedUpdate}
                onChange={(event) => setNoLinkedUpdate(event.target.checked)}
              />
            }
            label="Don't update sibling realms"
          />
          <Typography variant="caption" color="text.secondary">
            Saving records the current time as the update point and persists the
            timer in this browser.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={!canSave}>
          Update timer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
