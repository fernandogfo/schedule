import { describe, expect, it } from 'vitest';
import {
  distributeKeys,
  movePanel,
  normalizeLayoutColumns,
  normalizePanelLayout,
  resolvePanelLayout,
  type PanelLayout,
} from './layout';

const keys = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('panel layout normalization', () => {
  it('removes duplicate and invalid keys', () => {
    expect(normalizePanelLayout([['a', 'a', 1], 'x', ['b', null]])).toEqual([
      ['a'],
      ['b'],
    ]);
  });

  it('normalizes the configured column count', () => {
    expect(normalizeLayoutColumns(0)).toBe(0);
    expect(normalizeLayoutColumns(4)).toBe(4);
    expect(normalizeLayoutColumns('6')).toBe(6);
    expect(normalizeLayoutColumns(7)).toBe(0);
    expect(normalizeLayoutColumns('nope')).toBe(0);
  });
});

describe('panel layout distribution', () => {
  it('distributes keys into balanced columns', () => {
    expect(distributeKeys(keys, 4)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
      ['f'],
    ]);
  });

  it('preserves the predefined layout for ten panels in two or three columns', () => {
    const tenKeys = Array.from({ length: 10 }, (_, index) => `panel-${index}`);

    expect(distributeKeys(tenKeys, 2).map((column) => column.length)).toEqual([
      6, 4,
    ]);
    expect(distributeKeys(tenKeys, 3).map((column) => column.length)).toEqual([
      4, 4, 2,
    ]);
  });
});

describe('panel layout resolution', () => {
  it('preserves an existing layout when the column count is unchanged', () => {
    const stored: PanelLayout = [
      ['c', 'a'],
      ['b'],
    ];

    expect(resolvePanelLayout(stored, keys, 2)).toEqual([
      ['c', 'a'],
      ['b', 'd', 'e', 'f'],
    ]);
  });

  it('redistributes panels when the column count changes', () => {
    const stored: PanelLayout = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ];

    const result = resolvePanelLayout(stored, keys, 3);
    expect(result).toHaveLength(3);
    expect(result.flat()).toEqual(keys);
  });

  it('migrates the legacy flat order when no layout exists', () => {
    expect(resolvePanelLayout([], ['a', 'b', 'c'], 2, ['c', 'a'])).toEqual([
      ['c', 'a'],
      ['b'],
    ]);
  });

  it('drops removed panels and appends new panels', () => {
    const stored: PanelLayout = [
      ['a', 'removed'],
      ['b'],
    ];

    expect(resolvePanelLayout(stored, ['a', 'b', 'new'], 2)).toEqual([
      ['a'],
      ['b', 'new'],
    ]);
  });
});

describe('panel movement', () => {
  it('moves a panel within the same column', () => {
    const layout: PanelLayout = [['a', 'b', 'c'], ['d']];

    expect(movePanel(layout, 'a', 0, 2)).toEqual([['b', 'a', 'c'], ['d']]);
  });

  it('moves a panel to another column at a specific position', () => {
    const layout: PanelLayout = [['a', 'b'], ['c', 'd']];

    expect(movePanel(layout, 'a', 1, 1)).toEqual([['b'], ['c', 'a', 'd']]);
  });

  it('moves a panel into an empty column', () => {
    const layout: PanelLayout = [['a', 'b'], []];

    expect(movePanel(layout, 'a', 1, 0)).toEqual([['b'], ['a']]);
  });

  it('does nothing for an unknown panel or invalid column', () => {
    const layout: PanelLayout = [['a']];

    expect(movePanel(layout, 'missing', 0, 0)).toBe(layout);
    expect(movePanel(layout, 'a', 2, 0)).toBe(layout);
  });
});
