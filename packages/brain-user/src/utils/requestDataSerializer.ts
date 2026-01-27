import type {
  RequestAdapterConfig,
  RequestPluginConfig
} from '@qlover/fe-corekit';

export const requestDataSerializer = (
  data: unknown,
  config: RequestAdapterConfig &
    Omit<RequestPluginConfig, 'requestDataSerializer'>
) => {
  if (data instanceof FormData) {
    return data;
  }

  if (
    config.responseType === 'json' &&
    typeof data === 'object' &&
    data != null
  ) {
    return JSON.stringify(data);
  }

  return data;
};
