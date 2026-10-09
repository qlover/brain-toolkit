import { ExecutorError } from '@qlover/fe-corekit';
import { BrainUserIdentifier } from './config/identifier';

/**
 * Best human-readable message from a Brain error body, e.g.
 * `{ detail }`, `{ non_field_errors: [...] }` or `{ field: [...] }`.
 */
export function resolveBrainErrorMessage(
  data: unknown,
  status: number
): string {
  const fallback = `Brain API request failed with status ${status}`;
  if (!data || typeof data !== 'object') {
    return typeof data === 'string' && data.trim() ? data.trim() : fallback;
  }

  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === 'string' && obj.detail.trim()) {
    return obj.detail.trim();
  }
  if (Array.isArray(obj.non_field_errors) && obj.non_field_errors.length > 0) {
    return String(obj.non_field_errors[0]);
  }
  for (const [field, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0) {
      return `${field}: ${String(value[0])}`;
    }
    if (typeof value === 'string' && value.trim()) {
      return `${field}: ${value.trim()}`;
    }
  }
  return fallback;
}

/**
 * Brain API answered with HTTP status >= 400. The parsed response body is kept
 * on {@link BrainUserHttpError.data `data`} for callers that inspect it.
 */
export class BrainUserHttpError extends ExecutorError {
  constructor(
    public readonly status: number,
    public readonly data: unknown
  ) {
    super(
      BrainUserIdentifier.HTTP_ERROR,
      resolveBrainErrorMessage(data, status)
    );
    this.name = 'BrainUserHttpError';
  }
}
