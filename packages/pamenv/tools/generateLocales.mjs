import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Ts2Locales } = require('@brain-toolkit/ts2locales');

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IDENTIFIER_DIR = join(PACKAGE_ROOT, 'src', 'i18n', 'identifier');
const TARGET = join(PACKAGE_ROOT, 'dist', 'locales', '{{lng}}.json');
const LOCALES = ['en', 'zh'];

/**
 * @param {string} dir
 * @returns {string[]}
 */
function collectTsFiles(dir) {
  /** @type {string[]} */
  const files = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Generates pamenv CLI locale JSON into dist/locales.
 */
export async function generatePamenvLocales() {
  mkdirSync(join(PACKAGE_ROOT, 'dist', 'locales'), { recursive: true });
  const sources = collectTsFiles(IDENTIFIER_DIR);
  if (sources.length === 0) {
    throw new Error(`No identifier .ts files under ${IDENTIFIER_DIR}`);
  }

  const ts2Locale = new Ts2Locales(LOCALES);
  for (const source of sources) {
    await ts2Locale.generate({
      source,
      target: TARGET
    });
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
// Windows path / URL quirks: also match basename
const ranDirectly =
  Boolean(process.argv[1]) &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].replace(/\\/g, '/').endsWith('/tools/generateLocales.mjs'));

if (ranDirectly || isMain) {
  generatePamenvLocales()
    .then(() => {
      console.log('Generated pamenv locales → dist/locales');
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
