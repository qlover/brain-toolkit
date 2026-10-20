import {
  injectPamenvProcessEnv,
  type PamenvInjectOptions
} from 'pamenv-cli';

export type { PamenvInjectOptions };

export type PamenvNextConfigContext = {
  readonly defaultConfig: unknown;
};

/**
 * Returns a Next config wrapper, same shape as `createNextIntlPlugin`.
 *
 * Next calls the result with `(phase, context)`. PAM values are written to
 * `process.env` first, then the inner config (object or plugin) runs.
 *
 * @example
 * const withPamenv = createPamenvPlugin({
 *   slug: 'pam',
 *   env: 'local',
 *   debug: process.env.PAMENV_DEBUG === '1'
 * });
 * export default withPamenv(withNextIntl(nextConfig));
 *
 * @param options - Same fields as `pamenv run <slug> -e <env>`; `debug` defaults to false
 */
export function createPamenvPlugin(options: PamenvInjectOptions) {
  return function withPamenv<TConfig>(
    config:
      | TConfig
      | ((
          phase: string,
          context: PamenvNextConfigContext
        ) => TConfig | Promise<TConfig>)
  ): (phase: string, context: PamenvNextConfigContext) => Promise<TConfig> {
    return async (phase, context) => {
      await injectPamenvProcessEnv({
        ...options,
        enabled: isEnabled(options, phase)
      });
      if (typeof config === 'function') {
        return await (
          config as (
            phase: string,
            context: PamenvNextConfigContext
          ) => TConfig | Promise<TConfig>
        )(phase, context);
      }
      return config;
    };
  };
}

function isEnabled(options: PamenvInjectOptions, phase: string): boolean {
  if (typeof options.enabled === 'function') {
    return options.enabled(phase);
  }
  if (options.enabled === false) {
    return false;
  }
  if (options.enabled === true) {
    return true;
  }
  return phase === 'phase-development-server';
}
