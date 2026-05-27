import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { parseOAuthTokenRequest } from '@server/oauth/utils/parseOAuthTokenRequest';

function formRequest(
  body: string,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest('http://localhost/oauth/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...headers
    },
    body
  });
}

describe('parseOAuthTokenRequest', () => {
  it('parses application/x-www-form-urlencoded body', async () => {
    const fields = await parseOAuthTokenRequest(
      formRequest(
        'grant_type=authorization_code&code=abc&redirect_uri=https%3A%2F%2Fapp.example%2Fcb&client_id=c1'
      )
    );

    expect(fields.grant_type).toBe('authorization_code');
    expect(fields.code).toBe('abc');
    expect(fields.client_id).toBe('c1');
  });

  it('merges HTTP Basic credentials when client_id is absent in body', async () => {
    const basic = Buffer.from('client_basic:secret_basic').toString('base64');
    const fields = await parseOAuthTokenRequest(
      formRequest('grant_type=refresh_token&refresh_token=rt1', {
        authorization: `Basic ${basic}`
      })
    );

    expect(fields.client_id).toBe('client_basic');
    expect(fields.client_secret).toBe('secret_basic');
    expect(fields.refresh_token).toBe('rt1');
  });

  it('does not override body client_id with Basic auth', async () => {
    const basic = Buffer.from('other:secret').toString('base64');
    const fields = await parseOAuthTokenRequest(
      formRequest(
        'grant_type=refresh_token&refresh_token=rt1&client_id=from_body',
        {
          authorization: `Basic ${basic}`
        }
      )
    );

    expect(fields.client_id).toBe('from_body');
  });
});
