/**
 * Terminal table helpers for CLI list output.
 *
 * Significance: Align columns when labels may include CJK (width ≠ length).
 * Core idea: Measure East-Asian fullwidth as 2 columns; pad with spaces.
 */

/**
 * Approximate terminal column width (CJK / fullwidth → 2).
 *
 * @param text - Cell text
 */
export function pamCliDisplayWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    width += isWideTerminalChar(code) ? 2 : 1;
  }
  return width;
}

/**
 * Right-pads `text` with spaces to at least `width` terminal columns.
 *
 * @param text - Cell text
 * @param width - Target display width
 */
export function pamCliPadDisplay(text: string, width: number): string {
  const pad = Math.max(0, width - pamCliDisplayWidth(text));
  return text + ' '.repeat(pad);
}

/**
 * Truncates to `maxWidth` terminal columns, appending `…` when clipped.
 *
 * @param text - Cell text
 * @param maxWidth - Max display width (must be ≥ 1)
 */
export function pamCliTruncateDisplay(text: string, maxWidth: number): string {
  if (maxWidth < 1 || pamCliDisplayWidth(text) <= maxWidth) {
    return text;
  }
  if (maxWidth === 1) {
    return '…';
  }
  let out = '';
  let width = 0;
  for (const ch of text) {
    const next = isWideTerminalChar(ch.codePointAt(0) ?? 0) ? 2 : 1;
    if (width + next > maxWidth - 1) {
      break;
    }
    out += ch;
    width += next;
  }
  return `${out}…`;
}

/**
 * Formats an aligned table (header + rows). Column widths follow content,
 * capped per `maxWidths` when provided.
 *
 * @param header - Column titles
 * @param rows - Data rows (same length as header)
 * @param options.maxWidths - Optional per-column display caps
 * @param options.gap - Spaces between columns (default 2)
 */
export function pamCliFormatTable(
  header: readonly string[],
  rows: readonly (readonly string[])[],
  options?: {
    readonly maxWidths?: readonly (number | undefined)[];
    readonly gap?: number;
  }
): string[] {
  const colCount = header.length;
  const gap = options?.gap ?? 2;
  const gapStr = ' '.repeat(gap);
  const maxWidths = options?.maxWidths ?? [];

  const cells: string[][] = [
    [...header],
    ...rows.map((row) =>
      Array.from({ length: colCount }, (_, i) => row[i] ?? '')
    )
  ];

  for (let c = 0; c < colCount; c++) {
    const cap = maxWidths[c];
    if (cap === undefined) {
      continue;
    }
    for (const row of cells) {
      row[c] = pamCliTruncateDisplay(row[c] ?? '', cap);
    }
  }

  const widths = Array.from({ length: colCount }, (_, c) =>
    Math.max(...cells.map((row) => pamCliDisplayWidth(row[c] ?? '')))
  );

  return cells.map((row) =>
    row
      .map((cell, c) =>
        c === colCount - 1
          ? (cell ?? '')
          : pamCliPadDisplay(cell ?? '', widths[c] ?? 0)
      )
      .join(gapStr)
      .trimEnd()
  );
}

function isWideTerminalChar(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x115f) ||
    code === 0x2329 ||
    code === 0x232a ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe10 && code <= 0xfe19) ||
    (code >= 0xfe30 && code <= 0xfe6f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x1f300 && code <= 0x1f64f) ||
    (code >= 0x1f900 && code <= 0x1f9ff)
  );
}
