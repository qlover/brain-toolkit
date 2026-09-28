import { readFile } from 'fs/promises';
import path from 'path';

/**
 * The CLI docs page renders the pamenv README directly so the two never drift.
 * Read at build time (the page is statically generated per locale).
 */
export async function readPamenvReadme(locale: string): Promise<string> {
  const fileName = locale === 'zh' ? 'README.md' : 'README_EN.md';
  const candidates = [
    path.join(process.cwd(), '..', '..', 'packages', 'pamenv', fileName),
    path.join(process.cwd(), 'packages', 'pamenv', fileName)
  ];
  for (const file of candidates) {
    try {
      return await readFile(file, 'utf8');
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`pamenv ${fileName} not found`);
}
