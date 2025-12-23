export type BrainGatewayEndpointMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

export type EndpointsType = `${BrainGatewayEndpointMethod} ${string}`;

export function parseEndpoint(endpoint: EndpointsType): {
  method: BrainGatewayEndpointMethod;
  url: string;
} {
  const [method = 'GET', url] = endpoint.split(' ');
  return { method: method.toUpperCase() as BrainGatewayEndpointMethod, url };
}

export const GATEWAY_BRAIN_USER_ENDPOINTS = {
  login: 'POST /api/auth/token.json',
  register: 'POST /api/users/signup.json',
  getUserInfo: 'GET /api/users/me.json',
  loginWithGoogle: 'POST /api/auth/google/imagica/token',
  /**
   * This api only support admin?
   */
  logout: 'POST /api/users/signout'
} as const;
