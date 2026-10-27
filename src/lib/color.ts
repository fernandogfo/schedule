export function getContrastText(color: string): '#000000' | '#ffffff' {
  const hex = color.replace('#', '');
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((value) => value + value)
          .join('')
      : hex.padEnd(6, '0').slice(0, 6);
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.65 ? '#000000' : '#ffffff';
}
