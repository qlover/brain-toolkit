import {
  BootstrapServer as KitBootstrapServer,
  createLogger
} from '@qlover/next-kit/server';
import type { IOCIdentifierMapServer } from '@config/ioc-identifiter';
import { ServerConfig } from './ServerConfig';
import { createServerIoc } from './serverIoc';

/**
 * Kit generics require `Record<PropertyKey, unknown>`; intersect so the
 * app's concrete IOC map is usable as the type parameter.
 */
export type PamServerIocMap = IOCIdentifierMapServer &
  Record<PropertyKey, unknown>;

/**
 * PAM server bootstrap: thin wrap around `@qlover/next-kit/server`
 * `BootstrapServer`, wiring the app's `ServerConfig` + `serverIoc`.
 */
export class BootstrapServer extends KitBootstrapServer<PamServerIocMap> {
  constructor(name?: string) {
    const serverConfig = new ServerConfig();
    const serverName = name ?? serverConfig.name;
    const logger = createLogger(serverName, serverConfig);
    const ioc = createServerIoc(logger, serverConfig);

    super({
      name: serverName,
      logger,
      ioc
    });
  }
}
