import { createPamenv } from '@pamenv/next';
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
export type BrainOAuthServerIocMap = IOCIdentifierMapServer &
  Record<PropertyKey, unknown>;

/**
 * brain-oauth server bootstrap：薄包 kit `BootstrapServer`（RSC / 仅需 IOC）。
 * 对外请用 {@link createBootstrapServer}，勿直接 `new`。
 */
class BootstrapServer extends KitBootstrapServer<BrainOAuthServerIocMap> {
  constructor(serverConfig: ServerConfig, name?: string) {
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

export type { BootstrapServer };

/**
 * 先解封 bag → 绑进 {@link ServerConfig} → 再构造 Bootstrap（RSC 等少数入口）。
 */
export async function createBootstrapServer(
  name?: string
): Promise<BootstrapServer> {
  const bag = await createPamenv();
  const serverConfig = new ServerConfig();
  serverConfig.bindPamenvBag(bag);
  return new BootstrapServer(serverConfig, name);
}
