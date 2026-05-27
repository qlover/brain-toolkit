/**
 * OAuth authorize page data shared by server rendering and client UI.
 *
 * Significance: Prevents UI components from importing server-only services for types.
 * Core idea: Keep the authorize page view model in the shared contract layer.
 * Main function: Describe client metadata and request parameters for consent rendering.
 * Main purpose: Let OAuth server modules move independently from UI code.
 *
 * @example
 * const clientId = data.clientId;
 */
export type OAuthAuthorizePageData = {
  clientId: string;
  clientName: string;
  clientUri: string | null;
  logoUri: string | null;
  redirectUri: string;
  scopes: string[];
  state?: string;
  responseType: 'code';
  codeChallenge?: string;
  codeChallengeMethod?: 'S256';
  confidential: boolean;
};
