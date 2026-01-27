import type {
  BrainGatewayEndpointMethod,
  EndpointsType
} from '../config/EndPoints';
import { parseEndpoint } from '../config/EndPoints';

export function getEndpotionResult(
  action: string,
  source1?: Record<string, EndpointsType>,
  source2?: Record<string, EndpointsType>
):
  | {
      method: BrainGatewayEndpointMethod;
      url: string;
    }
  | undefined {
  if (!source1 && !source2) {
    return;
  }

  const endpoint = source1?.[action] ?? source2?.[action];

  if (endpoint) {
    return parseEndpoint(endpoint);
  }
}
