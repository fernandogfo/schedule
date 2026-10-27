import { useMemo } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AlertEngine } from './features/alerts/AlertEngine';
import { AudioProvider } from './features/audio/AudioProvider';
import { SpeechProvider } from './features/speech/SpeechProvider';
import { SchedulePage } from './pages/SchedulePage';
import { ScheduleProvider, useSchedule } from './state/ScheduleProvider';

function ScheduleApp() {
  const {
    data,
    loading,
    error,
    preferences,
    reload,
  } = useSchedule();

  const theme = useMemo(() => {
    const dark = preferences.darkMode;
    return createTheme({
      palette: {
        mode: dark ? 'dark' : 'light',
        primary: {
          main: data?.theme.primary ?? '#009688',
          contrastText: data?.theme.primaryContrast ?? '#ffffff',
        },
        secondary: {
          main: '#e8b600',
        },
        background: {
          default: dark ? '#151719' : '#ece8de',
          paper: dark ? '#22262a' : '#ffffff',
        },
      },
      shape: {
        borderRadius: 4,
      },
      typography: {
        fontFamily:
          data?.theme.fontFamily ??
          '"Flareserif821BT-Roman", "Helvetica", "Arial", sans-serif',
        button: {
          textTransform: 'none',
        },
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
            },
          },
        },
      },
    });
  }, [data?.theme.fontFamily, data?.theme.primary, data?.theme.primaryContrast, preferences.darkMode]);

  let content;
  if (!data && loading) {
    content = (
      <Box className="loading-page">
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading schedule…
        </Typography>
      </Box>
    );
  } else if (!data && error) {
    content = (
      <Box className="loading-page">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void reload()}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Could not load the schedule</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  } else if (data) {
    content = (
      <SpeechProvider>
        <AudioProvider>
          <AlertEngine />
          <SchedulePage />
        </AudioProvider>
      </SpeechProvider>
    );
  } else {
    content = null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {content}
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ScheduleProvider>
      <ScheduleApp />
    </ScheduleProvider>
  );
}
