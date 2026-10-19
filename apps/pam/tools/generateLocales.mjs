import { readdirSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ts2Locales } from '@brain-toolkit/ts2locales';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const identifierDir = join(projectRoot, 'shared', 'config', 'i18n-identifier');
const locales = ['en', 'zh'];

function listTsFiles(dir) {
  const files = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...listTsFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const ts2Locale = new Ts2Locales(locales);
const tasks = listTsFiles(identifierDir).map((source) => ({
  source: isAbsolute(source) ? source : join(projectRoot, source),
  target: join(projectRoot, 'public', 'locales', '{{lng}}.json')
}));

for (const task of tasks) {
  await ts2Locale.generate(task);
}

console.log(
  `Generated pam locales → public/locales (${tasks.length} identifier files)`
);
