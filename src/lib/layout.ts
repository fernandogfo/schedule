export type PanelLayout = string[][];

export const MAX_LAYOUT_COLUMNS = 6;

const LEGACY_LAYOUT_INDEXES: Record<number, number[][]> = {
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

function uniqueKeys(keys: readonly string[]): string[] {
  return [
    ...new Set(
      keys.filter((key): key is string => typeof key === 'string' && key.length > 0),
    ),
  ];
}

function clampColumnCount(columns: number): number {
  if (!Number.isFinite(columns)) return 1;
  return Math.max(1, Math.min(MAX_LAYOUT_COLUMNS, Math.trunc(columns)));
}

export function normalizeLayoutColumns(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return 0;
  const columns = Math.trunc(parsed);
  return columns >= 1 && columns <= MAX_LAYOUT_COLUMNS ? columns : 0;
}

export function normalizePanelLayout(value: unknown): PanelLayout {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const layout: PanelLayout = [];

  value.forEach((column) => {
    if (!Array.isArray(column)) return;
    const nextColumn: string[] = [];

    column.forEach((key) => {
      if (typeof key !== 'string' || key.length === 0 || seen.has(key)) return;
      seen.add(key);
      nextColumn.push(key);
    });

    layout.push(nextColumn);
  });

  return layout;
}

export function flattenPanelLayout(layout: PanelLayout): string[] {
  return layout.flat();
}

export function distributeKeys(
  keys: readonly string[],
  columns: number,
): PanelLayout {
  const unique = uniqueKeys(keys);
  const count = clampColumnCount(columns);

  if (unique.length === 0) {
    return Array.from({ length: count }, () => []);
  }

  if (unique.length === 10 && (count === 2 || count === 3)) {
    const predefined = LEGACY_LAYOUT_INDEXES[count];
    if (predefined) {
      return predefined.map((column) =>
        column
          .map((index) => unique[index])
          .filter((key): key is string => Boolean(key)),
      );
    }
  }

  const base = Math.floor(unique.length / count);
  const extra = unique.length % count;
  let cursor = 0;

  return Array.from({ length: count }, (_, index) => {
    const size = base + (index < extra ? 1 : 0);
    const column = unique.slice(cursor, cursor + size);
    cursor += size;
    return column;
  });
}

export function resolvePanelLayout(
  stored: unknown,
  keys: readonly string[],
  columns: number,
  legacyOrder: readonly string[] = [],
): PanelLayout {
  const count = clampColumnCount(columns);
  const currentKeys = uniqueKeys(keys);
  const keySet = new Set(currentKeys);
  const normalized = normalizePanelLayout(stored);
  const validStored = normalized.map((column) =>
    column.filter((key) => keySet.has(key)),
  );
  const storedCount = validStored.reduce(
    (total, column) => total + column.length,
    0,
  );

  if (normalized.length === count && storedCount > 0) {
    const seen = new Set<string>();
    const next = validStored.map((column) => {
      const result: string[] = [];
      column.forEach((key) => {
        if (seen.has(key)) return;
        seen.add(key);
        result.push(key);
      });
      return result;
    });

    const missing = currentKeys.filter((key) => !seen.has(key));
    if (missing.length > 0) {
      next[next.length - 1].push(...missing);
    }

    return next;
  }

  const order = [
    ...flattenPanelLayout(validStored),
    ...legacyOrder.filter(
      (key): key is string => typeof key === 'string' && keySet.has(key),
    ),
    ...currentKeys,
  ];

  return distributeKeys(uniqueKeys(order), count);
}

export function movePanel(
  layout: PanelLayout,
  key: string,
  targetColumn: number,
  targetIndex: number,
): PanelLayout {
  const sourceColumn = layout.findIndex((column) => column.includes(key));
  if (sourceColumn < 0 || !Number.isFinite(targetColumn)) return layout;

  const column = Math.trunc(targetColumn);
  if (column < 0 || column >= layout.length) return layout;

  const next = layout.map((items) => [...items]);
  const sourceIndex = next[sourceColumn].indexOf(key);
  if (sourceIndex < 0) return layout;

  next[sourceColumn].splice(sourceIndex, 1);

  let index = Number.isFinite(targetIndex)
    ? Math.trunc(targetIndex)
    : next[column].length;
  if (sourceColumn === column && sourceIndex < index) index -= 1;
  index = Math.max(0, Math.min(index, next[column].length));

  next[column].splice(index, 0, key);
  return next;
}
