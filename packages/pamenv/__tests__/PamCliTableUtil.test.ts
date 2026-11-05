import { describe, expect, it } from 'vitest';
import {
  pamCliDisplayWidth,
  pamCliFormatTable,
  pamCliPadDisplay,
  pamCliTruncateDisplay
} from '../src/impls/PamCliTableUtil';

describe('PamCliTableUtil', () => {
  it('counts CJK as double width', () => {
    expect(pamCliDisplayWidth('ab')).toBe(2);
    expect(pamCliDisplayWidth('中文')).toBe(4);
    expect(pamCliDisplayWidth('a中')).toBe(3);
  });

  it('pads and truncates by display width', () => {
    expect(pamCliPadDisplay('中', 4)).toBe('中  ');
    expect(pamCliTruncateDisplay('中文名很长', 5)).toBe('中文…');
  });

  it('formats an aligned table', () => {
    const lines = pamCliFormatTable(
      ['SLUG', 'NAME'],
      [
        ['web', '站点'],
        ['long-slug-name', 'x']
      ]
    );
    expect(lines).toHaveLength(3);
    expect(lines[0]?.startsWith('SLUG')).toBe(true);
    // Second data row slug is longer → columns share that width.
    expect(pamCliDisplayWidth(lines[2]!.slice(0, lines[2]!.indexOf('x')))).toBeGreaterThanOrEqual(
      pamCliDisplayWidth('long-slug-name')
    );
  });
});
