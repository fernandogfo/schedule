import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { CategoryPanel } from '../components/CategoryPanel';
import { CargoShipCard } from '../components/CargoShipCard';
import { EditEventDialog } from '../components/EditEventDialog';
import { ScheduleToolbar } from '../components/ScheduleToolbar';
import { SettingsDialog } from '../components/SettingsDialog';
import { useSchedule } from '../state/ScheduleProvider';
import { useAudioCues } from '../features/audio/AudioProvider';
import { calculateEventStates } from '../lib/schedule';
import { STORAGE_KEYS } from '../lib/constants';
import { usePersistentState } from '../state/usePersistentState';
import type { Category, EventWithTimers } from '../schemas/schedule';

type ColumnItem =
  | { kind: 'category'; category: Category }
  | { kind: 'cargo' };

const PREDEFINED_COLUMNS: Record<number, number[][]> = {
  1: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
  2: [
    [0, 3, 4, 5, 7, 9],
    [1, 2, 6, 8],
  ],
  3: [
    [0, 3, 5, 8],
    [1, 4, 6, 9],
    [2, 7],
  ],
};

function itemKey(item: ColumnItem): string {
  return item.kind === 'cargo' ? 'cargo' : `category:${item.category.id}`;
}

function distributeItems(count: number, columns: number): number[][] {
  if (columns === 1) {
    return [Array.from({ length: count }, (_, index) => index)];
  }
  if (count === 10 && PREDEFINED_COLUMNS[columns]) {
    return PREDEFINED_COLUMNS[columns];
  }

  const perColumn = Math.ceil(count / columns);
  return Array.from({ length: columns }, (_, column) =>
    Array.from({ length: count }, (_, index) => index).filter(
      (index) => Math.min(columns - 1, Math.floor(index / perColumn)) === column,
    ),
  );
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

interface EditState {
  event: EventWithTimers | null;
  isBaseEvent: boolean;
}

function normalizeCollapsedCategories(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === 'boolean',
    ),
  );
}

function normalizePanelOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))];
}

export function SchedulePage() {
  const {
    data,
    events,
    now,
    preferences,
    warning,
    dismissWarning,
    alertSelections,
  } = useSchedule();
  const { unlocked, testAudio } = useAudioCues();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [collapsedCategories, setCollapsedCategories] = usePersistentState<
    Record<string, boolean>
  >(STORAGE_KEYS.collapsedCategories, {}, normalizeCollapsedCategories);
  const [panelOrder, setPanelOrder] = usePersistentState<string[]>(
    STORAGE_KEYS.panelOrder,
    [],
    normalizePanelOrder,
  );
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const columns = Math.max(1, Math.min(3, Math.floor(width / 380)));

  const states = useMemo(() => {
    if (!data) return [];
    return calculateEventStates(
      events,
      now,
      preferences.region,
      preferences.showDisabled,
    );
  }, [data, events, now, preferences.region, preferences.showDisabled]);

  const statesByCategory = useMemo(() => {
    const map = new Map<string, typeof states>();
    states.forEach((state) => {
      const list = map.get(state.event.categoryId) ?? [];
      list.push(state);
      map.set(state.event.categoryId, list);
    });
    return map;
  }, [states]);

  const items = useMemo<ColumnItem[]>(() => {
    if (!data) return [];
    const baseItems: ColumnItem[] = data.categories.map((category) => ({
      kind: 'category',
      category,
    }));
    if (data.cargoShip.enabled) baseItems.push({ kind: 'cargo' });

    const remaining = new Map(baseItems.map((item) => [itemKey(item), item]));
    const ordered: ColumnItem[] = [];
    panelOrder.forEach((key) => {
      const item = remaining.get(key);
      if (!item) return;
      ordered.push(item);
      remaining.delete(key);
    });
    remaining.forEach((item) => ordered.push(item));
    return ordered;
  }, [data, panelOrder]);

  const assignments = distributeItems(items.length, columns);
  const hasAlerts = Object.values(alertSelections).some((list) => list.length > 0);

  useEffect(() => {
    if (data?.meta.title) document.title = data.meta.title;
  }, [data?.meta.title]);

  const toggleCategory = useCallback(
    (categoryId: string) => {
      setCollapsedCategories((current) => ({
        ...current,
        [categoryId]: !current[categoryId],
      }));
    },
    [setCollapsedCategories],
  );

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    key: string,
  ) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;
    setDraggedKey(key);
    setDragOverKey(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', key);
    event.dataTransfer.setDragImage(event.currentTarget, 24, 24);
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    key: string,
  ) => {
    if (!draggedKey || draggedKey === key) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverKey !== key) setDragOverKey(key);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
    key: string,
  ) => {
    if (
      dragOverKey === key &&
      !event.currentTarget.contains(event.relatedTarget as Node | null)
    ) {
      setDragOverKey(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, key: string) => {
    event.preventDefault();
    const fromKey = event.dataTransfer.getData('text/plain') || draggedKey;
    setDraggedKey(null);
    setDragOverKey(null);
    if (!fromKey || fromKey === key) return;

    const keys = items.map(itemKey);
    const fromIndex = keys.indexOf(fromKey);
    const toIndex = keys.indexOf(key);
    if (fromIndex < 0 || toIndex < 0) return;

    [keys[fromIndex], keys[toIndex]] = [keys[toIndex], keys[fromIndex]];
    setPanelOrder(keys);
  };

  if (!data) return null;

  const openEdit = (event: EventWithTimers) => {
    setEditState({
      event,
      isBaseEvent: data.events.some((item) => item.id === event.id),
    });
  };

  return (
    <Box
      className={`app-page${preferences.darkMode ? ' dark' : ''}`}
      sx={{
        backgroundImage: data.theme.backgroundImage
          ? `linear-gradient(rgba(18, 22, 24, 0.05), rgba(18, 22, 24, 0.22)), url(${data.theme.backgroundImage})`
          : undefined,
      }}
    >
      <ScheduleToolbar
        onAddEvent={() => setEditState({ event: null, isBaseEvent: false })}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Box className="page-content" ref={ref}>
        <Stack spacing={1.5} className="status-banners">
          {hasAlerts && unlocked === false && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={testAudio}>
                  Enable sound
                </Button>
              }
            >
              <AlertTitle>Audio playback is blocked</AlertTitle>
              Your browser needs a click before it can play alert sounds.
            </Alert>
          )}
          {data.notice && <Alert severity="info">{data.notice}</Alert>}
          {warning && (
            <Alert severity="warning" onClose={dismissWarning}>
              {warning}
            </Alert>
          )}
        </Stack>

        <Box className="schedule-categories">
          {assignments.map((column, columnIndex) => (
            <Box className="schedule-column" key={`column-${columnIndex}`}>
              {column.map((itemIndex) => {
                const item = items[itemIndex];
                if (!item) return null;
                const key = itemKey(item);
                return (
                  <Box
                    key={key}
                    className={[
                      'movable-panel',
                      draggedKey === key ? 'dragging' : '',
                      dragOverKey === key && draggedKey !== key ? 'drag-over' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onDragStart={(event) => handleDragStart(event, key)}
                    onDragEnd={() => {
                      setDraggedKey(null);
                      setDragOverKey(null);
                    }}
                    onDragOver={(event) => handleDragOver(event, key)}
                    onDragLeave={(event) => handleDragLeave(event, key)}
                    onDrop={(event) => handleDrop(event, key)}
                  >
                    {item.kind === 'cargo' ? (
                      <CargoShipCard />
                    ) : (
                      <CategoryPanel
                        category={item.category}
                        states={statesByCategory.get(item.category.id) ?? []}
                        collapsed={Boolean(collapsedCategories[item.category.id])}
                        onToggle={() => toggleCategory(item.category.id)}
                        onEdit={openEdit}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box className="page-footnote">
          Times are shown in your local timezone. In-game time is approximate.
        </Box>
      </Box>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {editState && (
        <EditEventDialog
          key={editState.event?.id ?? 'new-event'}
          open
          event={editState.event}
          isBaseEvent={editState.isBaseEvent}
          onClose={() => setEditState(null)}
        />
      )}
    </Box>
  );
}
