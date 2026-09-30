import {
  isNextKitApiError,
  isNextKitApiSuccess,
  type NextKitApiResult
} from '@qlover/next-kit/common';

export async function readAppApiJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as NextKitApiResult<T>;

  if (isNextKitApiError(body)) {
    throw new Error(body.message ?? body.id);
  }

  if (!isNextKitApiSuccess<T>(body)) {
    throw new Error('Invalid API response');
  }

  return body.data as T;
}

/** Error from a machine OAuth endpoint; `code` is the RFC `error` value when present. */
export class OAuthMachineError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'OAuthMachineError';
  }
}

/**
 * Parse machine OAuth endpoints (`/oauth/token`, `/oauth/userinfo`, `/oauth/revoke`)
 * that return flat RFC JSON (no `{ success, data }` envelope).
 */
export async function readOAuthMachineJson<T = unknown>(
  response: Response
): Promise<T> {
  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok || typeof body.error === 'string') {
    const code = typeof body.error === 'string' ? body.error : undefined;
    const description =
      typeof body.error_description === 'string'
        ? body.error_description
        : (code ?? `OAuth request failed (${response.status})`);
    throw new OAuthMachineError(description, code);
  }

  return body as T;
}
