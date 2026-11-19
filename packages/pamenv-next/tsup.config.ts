import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  external: ['pamenv-cli'],
  outDir: 'dist',
  esbuildOptions(options, context) {
    if (context.format !== 'esm') {
      return;
    }
    options.banner = {
      js: [
        "import { createRequire as __pamenvCreateRequire } from 'node:module';",
        "import { fileURLToPath as __pamenvFileURLToPath } from 'node:url';",
        "import { dirname as __pamenvDirname } from 'node:path';",
        'const require = __pamenvCreateRequire(import.meta.url);',
        'const __filename = __pamenvFileURLToPath(import.meta.url);',
        'const __dirname = __pamenvDirname(__filename);'
      ].join('\n')
    };
  }
});
