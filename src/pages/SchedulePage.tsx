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
import { SponsorPanel } from '../components/SponsorPanel';
import { useSchedule } from '../state/ScheduleProvider';
import { useAudioCues } from '../features/audio/AudioProvider';
import { calculateEventStates } from '../lib/schedule';
import { STORAGE_KEYS } from '../lib/constants';
import {
  MAX_LAYOUT_COLUMNS,
  movePanel,
  resolvePanelLayout,
  type PanelLayout,
} from '../lib/layout';
import { usePersistentState } from '../state/usePersistentState';
import type { Category, EventWithTimers } from '../schemas/schedule';

type ColumnItem =
  | { kind: 'category'; category: Category }
  | { kind: 'sponsor' }
  | { kind: 'cargo' };

interface DropTarget {
  column: number;
  index: number;
}

function itemKey(item: ColumnItem): string {
  if (item.kind === 'cargo') return 'cargo';
  if (item.kind === 'sponsor') return 'sponsor';
  return `category:${item.category.id}`;
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

function clearLegacyPanelOrder() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.panelOrder);
  } catch {
    // Storage can be unavailable in private browsing or when the quota is full.
  }
}

export function SchedulePage() {
  const {
    data,
    events,
    now,
    preferences,
    setPreferences,
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
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const autoColumns = Math.max(1, Math.min(3, Math.floor(width / 380)));
  const columns =
    preferences.layoutColumns === 0
      ? autoColumns
      : Math.max(1, Math.min(MAX_LAYOUT_COLUMNS, preferences.layoutColumns));
  const wideLayout = columns > 3;

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
    baseItems.push({ kind: 'sponsor' });
    if (data.cargoShip.enabled) baseItems.push({ kind: 'cargo' });
    return baseItems;
  }, [data]);

  const itemKeys = useMemo(() => items.map(itemKey), [items]);
  const itemsByKey = useMemo(
    () => new Map(items.map((item) => [itemKey(item), item])),
    [items],
  );
  const layout = useMemo(
    () =>
      resolvePanelLayout(preferences.panelLayout, itemKeys, columns),
    [columns, itemKeys, preferences.panelLayout],
  );
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

  const commitLayout = useCallback(
    (next: PanelLayout) => {
      setPreferences((current) => ({ ...current, panelLayout: next }));
      clearLegacyPanelOrder();
    },
    [setPreferences],
  );

  const updateDropTarget = useCallback((column: number, index: number) => {
    setDropTarget((current) =>
      current?.column === column && current.index === index
        ? current
        : { column, index },
    );
  }, []);

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    key: string,
  ) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;
    setDraggedKey(key);
    setDropTarget(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', key);
    event.dataTransfer.setDragImage(event.currentTarget, 24, 24);
  };

  const handlePanelDragOver = (
    event: DragEvent<HTMLDivElement>,
    columnIndex: number,
    itemIndex: number,
  ) => {
    if (!draggedKey) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    updateDropTarget(columnIndex, itemIndex + (after ? 1 : 0));
  };

  const handleColumnDragOver = (
    event: DragEvent<HTMLDivElement>,
    columnIndex: number,
  ) => {
    if (!draggedKey) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    updateDropTarget(columnIndex, layout[columnIndex]?.length ?? 0);
  };

  const finishDrop = (
    event: DragEvent<HTMLDivElement>,
    columnIndex: number,
    index: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const fromKey = event.dataTransfer.getData('text/plain') || draggedKey;
    setDraggedKey(null);
    setDropTarget(null);
    if (!fromKey) return;
    commitLayout(movePanel(layout, fromKey, columnIndex, index));
  };

  const handlePanelDrop = (
    event: DragEvent<HTMLDivElement>,
    columnIndex: number,
    itemIndex: number,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    finishDrop(event, columnIndex, itemIndex + (after ? 1 : 0));
  };

  const handleColumnDrop = (
    event: DragEvent<HTMLDivElement>,
    columnIndex: number,
  ) => {
    finishDrop(event, columnIndex, layout[columnIndex]?.length ?? 0);
  };

  const handleContainerDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const related = event.relatedTarget as Node | null;
    if (!related || !event.currentTarget.contains(related)) {
      setDropTarget(null);
    }
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
      className={`app-page${preferences.darkMode ? ' dark' : ''}${
        wideLayout ? ' wide-layout' : ''
      }`}
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

        <Box
          className="schedule-categories"
          onDragLeave={handleContainerDragLeave}
        >
          {layout.map((column, columnIndex) => {
            const isColumnDropTarget =
              dropTarget?.column === columnIndex &&
              dropTarget?.index === column.length;

            return (
              <Box className="schedule-column" key={`column-${columnIndex}`}>
                {column.map((key, itemIndex) => {
                  const item = itemsByKey.get(key);
                  if (!item) return null;

                  const isDropBefore =
                    dropTarget?.column === columnIndex &&
                    dropTarget?.index === itemIndex;
                  const isDropAfter =
                    dropTarget?.column === columnIndex &&
                    dropTarget?.index === itemIndex + 1 &&
                    itemIndex === column.length - 1;

                  return (
                    <Box
                      key={key}
                      className={[
                        'movable-panel',
                        draggedKey === key ? 'dragging' : '',
                        isDropBefore ? 'drop-before' : '',
                        isDropAfter ? 'drop-after' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onDragStart={(event) => handleDragStart(event, key)}
                      onDragEnd={() => {
                        setDraggedKey(null);
                        setDropTarget(null);
                      }}
                      onDragOver={(event) =>
                        handlePanelDragOver(event, columnIndex, itemIndex)
                      }
                      onDrop={(event) =>
                        handlePanelDrop(event, columnIndex, itemIndex)
                      }
                    >
                      {item.kind === 'cargo' ? (
                        <CargoShipCard />
                      ) : item.kind === 'sponsor' ? (
                        <SponsorPanel
                          collapsed={Boolean(collapsedCategories.sponsor)}
                          onToggle={() => toggleCategory('sponsor')}
                        />
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
                <Box
                  className={[
                    'column-drop-zone',
                    column.length === 0 ? 'empty' : '',
                    draggedKey ? 'active' : '',
                    isColumnDropTarget ? 'drop-target' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onDragOver={(event) =>
                    handleColumnDragOver(event, columnIndex)
                  }
                  onDrop={(event) => handleColumnDrop(event, columnIndex)}
                >
                  {column.length === 0 && draggedKey
                    ? 'Drop panel here'
                    : null}
                </Box>
              </Box>
            );
          })}
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
