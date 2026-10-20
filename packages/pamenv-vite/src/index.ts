import {
  injectPamenvProcessEnv,
  type PamenvInjectOptions
} from 'pamenv-cli';
import type { ConfigEnv, Plugin } from 'vite';

export type { PamenvInjectOptions };

/**
 * Vite plugin that writes PAM variables onto `process.env` in an early
 * `config` hook (before most other plugins and `loadEnv` consumers see env).
 *
 * Default: only runs for `vite` / `vite dev` (`command === 'serve'`).
 * Pass `enabled: true` to also inject during `vite build`, or a function
 * receiving Vite's command (`serve` | `build`).
 *
 * @example
 * import { defineConfig } from 'vite';
 * import pamenv from '@pamenv/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     pamenv({
 *       slug: 'my-app',
 *       env: 'local',
 *       debug: process.env.PAMENV_DEBUG === '1'
 *     })
 *   ]
 * });
 *
 * @param options - Same fields as `pamenv run <slug> -e <env>`;
 *   `debug` / `envPriority` default false / `remote`
 */
export function createPamenvPlugin(options: PamenvInjectOptions): Plugin {
  return {
    name: 'pamenv',
    enforce: 'pre',
    async config(_userConfig, env) {
      await injectPamenvProcessEnv({
        ...options,
        enabled: isEnabled(options, env)
      });
      return;
    }
  };
}

/** Default export — idiomatic Vite plugin factory. */
export default createPamenvPlugin;

function isEnabled(options: PamenvInjectOptions, env: ConfigEnv): boolean {
  if (typeof options.enabled === 'function') {
    return options.enabled(env.command);
  }
  if (options.enabled === false) {
    return false;
  }
  if (options.enabled === true) {
    return true;
  }
  return env.command === 'serve';
}
