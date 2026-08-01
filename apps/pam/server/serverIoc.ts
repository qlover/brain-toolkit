import {
  createIOCFunction,
  ReflectionIOCContainer,
  type IOCContainerInterface,
  type IOCRegisterInterface
} from '@qlover/corekit-bridge/ioc';
import { SearchParamsValidator } from '@qlover/next-kit/common';
import { RequestLogsRepository, SupabaseRepo } from '@qlover/next-kit/server';
import { createAdminClient, createServerClient } from '@shared/supabase/server';
import { defaultSearchParams } from '@config/common';
import type { IOCIdentifierMapServer } from '@config/ioc-identifiter';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { SupabaseOAuthProvider } from './providers/SupabaseOAuthProvider';
import { PAMSupabaseRepo } from './repositorys/PAMSupabaseRepo';
import { ServerContext } from './utils/ServerContext';
import type { LoggerInterface } from '@qlover/logger';

type ServerIocOptions = {
  logger: LoggerInterface;
  config: SeedServerConfigInterface;
};

/**
 * Builds a fresh server IOC bound to the given logger.
 * Not a process singleton: each {@link BootstrapServer} / {@link NextApiServer}
 * instance must use the same logger for plugins and for `I.Logger` in services.
 */
export function createServerIoc(
  logger: LoggerInterface,
  config: SeedServerConfigInterface
) {
  const ioc = createIOCFunction<IOCIdentifierMapServer>(
    new ReflectionIOCContainer()
  );

  ServerIocRegister.register(ioc.implemention!, ioc, {
    logger,
    config
  });

  logger.debug('Server Ioc created');

  return ioc;
}

const ServerIocRegister: IOCRegisterInterface<
  IOCContainerInterface,
  ServerIocOptions
> = {
  register(ioc, _, options) {
    const { logger, config: serverConfig } = options!;

    ioc.bind(I.Logger, logger);
    ioc.bind(I.AppConfig, serverConfig);
    ioc.bind(I.ServerContextInterface, ioc.get(ServerContext));

    const supabaseDeps = {
      logger,
      getUserClient: createServerClient,
      getAdminClient: createAdminClient
    };

    ioc.bind(SupabaseRepo, new SupabaseRepo('', supabaseDeps));
    ioc.bind(PAMSupabaseRepo, new PAMSupabaseRepo('', supabaseDeps));
    ioc.bind(
      RequestLogsRepository,
      new RequestLogsRepository({
        ...supabaseDeps,
        serverContext: ioc.get(I.ServerContextInterface)
      })
    );

    ioc.bind(I.OAuthWrapperProviderInterface, ioc.get(SupabaseOAuthProvider));

    // pam uses a smaller default page size (10) than the kit default (20).
    // Kit's constructor param type is `typeof defaultSearchParams` (a literal
    // `pageSize: 20` type), so a structurally-compatible override needs an
    // `unknown` round-trip to bypass the literal mismatch.
    ioc.bind(
      SearchParamsValidator,
      new SearchParamsValidator(
        defaultSearchParams as unknown as ConstructorParameters<
          typeof SearchParamsValidator
        >[0]
      )
    );
  }
};
