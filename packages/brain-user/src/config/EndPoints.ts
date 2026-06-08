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

/** brain-user-system invoke path (relative to {@link BRAIN_DOMAINS}) */
export const BRAIN_USER_INVOKE_PATH = '/v1.0/invoke/brain-user-system/method';
/** userly invoke path (relative to {@link BRAIN_DOMAINS}) */
export const BRAIN_USERLY_INVOKE_PATH = '/v1.0/invoke/userly/method';

export const GATEWAY_BRAIN_USER_ENDPOINTS = {
  login: `POST ${BRAIN_USER_INVOKE_PATH}/api/auth/token.json`,
  register: `POST ${BRAIN_USER_INVOKE_PATH}/api/users/signup.json`,
  getUserInfo: `GET ${BRAIN_USER_INVOKE_PATH}/api/users/me.json`,
  loginWithGoogle: `POST ${BRAIN_USER_INVOKE_PATH}/api/auth/google/imagica/token`,
  /**
   * This api only support admin?
   */
  logout: `POST ${BRAIN_USER_INVOKE_PATH}/api/users/signout`,

  accessToken: `POST ${BRAIN_USERLY_INVOKE_PATH}/auth/access_token`,

  /**
   * OTP sign in
   */
  otpSign: `POST ${BRAIN_USERLY_INVOKE_PATH}/auth/otp/login`
} as const;
