import { z } from 'zod';

export const OAuthClientRowSchema = z.object({
  id: z.number(),
  client_id: z.string(),
  client_name: z.string(),
  client_uri: z.string().nullable().optional(),
  logo_uri: z.string().nullable().optional(),
  redirect_uris: z.array(z.string()),
  grant_types: z.array(z.string()),
  scopes: z.array(z.string()),
  confidential: z.boolean(),
  owner_user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string()
});

export type OAuthClientRow = z.infer<typeof OAuthClientRowSchema>;

export const OAuthAuthorizeQuerySchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().optional()
});

export type OAuthAuthorizeQuery = z.infer<typeof OAuthAuthorizeQuerySchema>;

export const OAuthConsentBodySchema = z.object({
  action: z.enum(['allow', 'deny']),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().optional(),
  trust: z.boolean().optional()
});

export type OAuthConsentBody = z.infer<typeof OAuthConsentBodySchema>;

export const OAuthAuthorizationCodeRowSchema = z.object({
  code: z.string(),
  client_id: z.string(),
  user_id: z.number(),
  redirect_uri: z.string(),
  scope: z.string().nullable().optional(),
  expires_at: z.string(),
  used: z.boolean(),
  created_at: z.string()
});

export type OAuthAuthorizationCodeRow = z.infer<
  typeof OAuthAuthorizationCodeRowSchema
>;
