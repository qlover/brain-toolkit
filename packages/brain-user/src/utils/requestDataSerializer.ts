import { ExecutorContext, RequestAdapterConfig } from '@qlover/fe-corekit';

export const requestDataSerializer = (
  data: unknown,
  context: ExecutorContext<RequestAdapterConfig<unknown>>
) => {
  if (data instanceof FormData) {
    return data;
  }

  if (
    context.parameters?.responseType === 'json' &&
    typeof data === 'object' &&
    data != null
  ) {
    return JSON.stringify(data);
  }

  return data;
};

