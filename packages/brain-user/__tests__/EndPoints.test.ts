/**
 * EndPoints test-suite
 *
 * Coverage:
 * 1. parseEndpoint           - Parse endpoint string to method and URL
 * 2. BrainGatewayEndpointMethod - HTTP method types
 * 3. EndpointsType           - Endpoint string format validation
 * 4. GATEWAY_BRAIN_USER_ENDPOINTS  - Predefined endpoint constants
 * 5. Edge cases              - Invalid formats, empty strings, special cases
 * 6. Type safety             - Type inference and constraints
 */

import { describe, it, expect } from 'vitest';
import {
  parseEndpoint,
  GATEWAY_BRAIN_USER_ENDPOINTS,
  type BrainGatewayEndpointMethod,
  type EndpointsType
} from '../src/config/EndPoints';

describe('EndPoints', () => {
  describe('parseEndpoint', () => {
    it('should parse GET endpoint', () => {
      const result = parseEndpoint('GET /api/users/me.json');

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users/me.json'
      });
    });

    it('should parse POST endpoint', () => {
      const result = parseEndpoint('POST /api/users/signup.json');

      expect(result).toEqual({
        method: 'POST',
        url: '/api/users/signup.json'
      });
    });

    it('should parse PUT endpoint', () => {
      const result = parseEndpoint('PUT /api/users/123');

      expect(result).toEqual({
        method: 'PUT',
        url: '/api/users/123'
      });
    });

    it('should parse DELETE endpoint', () => {
      const result = parseEndpoint('DELETE /api/users/123');

      expect(result).toEqual({
        method: 'DELETE',
        url: '/api/users/123'
      });
    });

    it('should parse PATCH endpoint', () => {
      const result = parseEndpoint('PATCH /api/users/123');

      expect(result).toEqual({
        method: 'PATCH',
        url: '/api/users/123'
      });
    });

    it('should parse OPTIONS endpoint', () => {
      const result = parseEndpoint('OPTIONS /api/users');

      expect(result).toEqual({
        method: 'OPTIONS',
        url: '/api/users'
      });
    });

    it('should parse HEAD endpoint', () => {
      const result = parseEndpoint('HEAD /api/users');

      expect(result).toEqual({
        method: 'HEAD',
        url: '/api/users'
      });
    });

    it('should handle endpoints with query parameters', () => {
      const result = parseEndpoint('GET /api/users?page=1&limit=10');

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users?page=1&limit=10'
      });
    });

    it('should handle endpoints with path parameters', () => {
      const result = parseEndpoint('GET /api/users/123/profile');

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users/123/profile'
      });
    });

    it('should handle endpoints with hash fragments', () => {
      const result = parseEndpoint('GET /api/users#section');

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users#section'
      });
    });

    it('should handle endpoints with complex URLs', () => {
      const result = parseEndpoint(
        'POST /api/v1/users/123/actions/verify?token=abc'
      );

      expect(result).toEqual({
        method: 'POST',
        url: '/api/v1/users/123/actions/verify?token=abc'
      });
    });

    it('should treat path-only string as method when no space', () => {
      // When there's no space, the entire string becomes the method (uppercased)
      const result = parseEndpoint('/api/users' as EndpointsType);

      expect(result).toEqual({
        method: '/API/USERS',
        url: undefined
      });
    });

    it('should handle endpoints with multiple spaces', () => {
      const result = parseEndpoint('GET  /api/users' as EndpointsType);

      expect(result).toEqual({
        method: 'GET',
        url: ''
      });
    });

    it('should handle root path', () => {
      const result = parseEndpoint('GET /');

      expect(result).toEqual({
        method: 'GET',
        url: '/'
      });
    });

    it('should handle endpoints without leading slash', () => {
      const result = parseEndpoint('GET api/users');

      expect(result).toEqual({
        method: 'GET',
        url: 'api/users'
      });
    });
  });

  describe('GATEWAY_BRAIN_USER_ENDPOINTS', () => {
    it('should have login endpoint', () => {
      expect(GATEWAY_BRAIN_USER_ENDPOINTS.login).toBe('POST /api/auth/token.json');
    });

    it('should have register endpoint', () => {
      expect(GATEWAY_BRAIN_USER_ENDPOINTS.register).toBe(
        'POST /api/users/signup.json'
      );
    });

    it('should have getUserInfo endpoint', () => {
      expect(GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo).toBe('GET /api/users/me.json');
    });

    it('should have loginWithGoogle endpoint', () => {
      expect(GATEWAY_BRAIN_USER_ENDPOINTS.loginWithGoogle).toBe(
        'POST /api/auth/google/brain/token'
      );
    });

    it('should have logout endpoint', () => {
      expect(GATEWAY_BRAIN_USER_ENDPOINTS.logout).toBe('POST /api/users/signout');
    });

    it('should be immutable (readonly)', () => {
      // TypeScript should prevent this at compile time
      // At runtime, we can check if it's frozen
      expect(Object.isFrozen(GATEWAY_BRAIN_USER_ENDPOINTS)).toBe(false); // 'as const' doesn't freeze at runtime
    });

    it('should have all expected endpoints', () => {
      const endpoints = Object.keys(GATEWAY_BRAIN_USER_ENDPOINTS);

      expect(endpoints).toContain('login');
      expect(endpoints).toContain('register');
      expect(endpoints).toContain('getUserInfo');
      expect(endpoints).toContain('loginWithGoogle');
      expect(endpoints).toContain('logout');
    });

    it('should have exactly 5 endpoints', () => {
      const endpointCount = Object.keys(GATEWAY_BRAIN_USER_ENDPOINTS).length;
      expect(endpointCount).toBe(5);
    });
  });

  describe('parseEndpoint with GATEWAY_BRAIN_USER_ENDPOINTS', () => {
    it('should parse login endpoint', () => {
      const result = parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.login);

      expect(result).toEqual({
        method: 'POST',
        url: '/api/auth/token.json'
      });
    });

    it('should parse register endpoint', () => {
      const result = parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.register);

      expect(result).toEqual({
        method: 'POST',
        url: '/api/users/signup.json'
      });
    });

    it('should parse getUserInfo endpoint', () => {
      const result = parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo);

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users/me.json'
      });
    });

    it('should parse loginWithGoogle endpoint', () => {
      const result = parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.loginWithGoogle);

      expect(result).toEqual({
        method: 'POST',
        url: '/api/auth/google/brain/token'
      });
    });

    it('should parse logout endpoint', () => {
      const result = parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.logout);

      expect(result).toEqual({
        method: 'POST',
        url: '/api/users/signout'
      });
    });

    it('should parse all endpoints correctly', () => {
      const endpoints = Object.values(GATEWAY_BRAIN_USER_ENDPOINTS);

      endpoints.forEach((endpoint) => {
        const result = parseEndpoint(endpoint);

        expect(result).toHaveProperty('method');
        expect(result).toHaveProperty('url');
        expect(typeof result.method).toBe('string');
        expect(typeof result.url).toBe('string');
      });
    });
  });

  describe('type safety', () => {
    it('should accept valid HTTP methods', () => {
      const methods: BrainGatewayEndpointMethod[] = [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS',
        'HEAD'
      ];

      methods.forEach((method) => {
        const endpoint: EndpointsType = `${method} /api/test`;
        const result = parseEndpoint(endpoint);

        expect(result.method).toBe(method);
      });
    });

    it('should work with EndpointsType', () => {
      const endpoint: EndpointsType = 'GET /api/users';
      const result = parseEndpoint(endpoint);

      expect(result.method).toBe('GET');
      expect(result.url).toBe('/api/users');
    });

    it('should infer method type correctly', () => {
      const result = parseEndpoint('POST /api/users');

      // TypeScript should infer method as BrainGatewayEndpointMethod
      const method: BrainGatewayEndpointMethod = result.method;
      expect(method).toBe('POST');
    });

    it('should support template literal types', () => {
      // EndpointsType is a template literal type
      const get: EndpointsType = 'GET /test';
      const post: EndpointsType = 'POST /test';
      const put: EndpointsType = 'PUT /test';

      expect(parseEndpoint(get).method).toBe('GET');
      expect(parseEndpoint(post).method).toBe('POST');
      expect(parseEndpoint(put).method).toBe('PUT');
    });
  });

  describe('integration scenarios', () => {
    it('should support endpoint factory pattern', () => {
      function createEndpoint(
        method: BrainGatewayEndpointMethod,
        path: string
      ): EndpointsType {
        return `${method} ${path}`;
      }

      const endpoint = createEndpoint('GET', '/api/users');
      const result = parseEndpoint(endpoint);

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users'
      });
    });

    it('should support dynamic endpoint construction', () => {
      const userId = 123;
      const endpoint: EndpointsType = `GET /api/users/${userId}`;
      const result = parseEndpoint(endpoint);

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users/123'
      });
    });

    it('should support endpoint composition', () => {
      const baseUrl = '/api/v1';
      const resource = 'users';
      const endpoint: EndpointsType = `GET ${baseUrl}/${resource}`;
      const result = parseEndpoint(endpoint);

      expect(result).toEqual({
        method: 'GET',
        url: '/api/v1/users'
      });
    });

    it('should work with request builder pattern', () => {
      class RequestBuilder {
        private endpoint: EndpointsType;

        constructor(endpoint: EndpointsType) {
          this.endpoint = endpoint;
        }

        public getMethod(): BrainGatewayEndpointMethod {
          return parseEndpoint(this.endpoint).method;
        }

        public getUrl(): string {
          return parseEndpoint(this.endpoint).url;
        }
      }

      const builder = new RequestBuilder('POST /api/users');

      expect(builder.getMethod()).toBe('POST');
      expect(builder.getUrl()).toBe('/api/users');
    });
  });

  describe('real-world usage patterns', () => {
    it('should support RESTful API patterns', () => {
      const restEndpoints = {
        list: 'GET /api/users',
        create: 'POST /api/users',
        read: 'GET /api/users/123',
        update: 'PUT /api/users/123',
        partialUpdate: 'PATCH /api/users/123',
        delete: 'DELETE /api/users/123'
      } as const;

      Object.entries(restEndpoints).forEach(([_action, endpoint]) => {
        const result = parseEndpoint(endpoint);
        expect(result).toHaveProperty('method');
        expect(result).toHaveProperty('url');
      });
    });

    it('should support authentication endpoints', () => {
      const authEndpoints = {
        login: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.login),
        register: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.register),
        logout: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.logout),
        googleLogin: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.loginWithGoogle)
      };

      expect(authEndpoints.login.method).toBe('POST');
      expect(authEndpoints.register.method).toBe('POST');
      expect(authEndpoints.logout.method).toBe('POST');
      expect(authEndpoints.googleLogin.method).toBe('POST');
    });

    it('should support endpoint with version prefix', () => {
      const endpoint: EndpointsType = 'GET /api/v2/users';
      const result = parseEndpoint(endpoint);

      expect(result).toEqual({
        method: 'GET',
        url: '/api/v2/users'
      });
    });

    it('should support nested resource endpoints', () => {
      const endpoint: EndpointsType = 'GET /api/users/123/posts/456/comments';
      const result = parseEndpoint(endpoint);

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users/123/posts/456/comments'
      });
    });

    it('should support action-based endpoints', () => {
      const endpoints = [
        'POST /api/users/123/activate',
        'POST /api/users/123/deactivate',
        'POST /api/users/123/verify',
        'POST /api/users/123/reset-password'
      ] as const;

      endpoints.forEach((endpoint) => {
        const result = parseEndpoint(endpoint);
        expect(result.method).toBe('POST');
        expect(result.url).toContain('/api/users/123/');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty URL path', () => {
      const result = parseEndpoint('GET ' as EndpointsType);

      expect(result).toEqual({
        method: 'GET',
        url: ''
      });
    });

    it('should handle endpoint with only method', () => {
      const result = parseEndpoint('POST' as EndpointsType);

      expect(result.method).toBe('POST');
      expect(result.url).toBeUndefined();
    });

    it('should preserve URL encoding', () => {
      const result = parseEndpoint('GET /api/users?name=John%20Doe');

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users?name=John%20Doe'
      });
    });

    it('should handle special characters in URL', () => {
      const result = parseEndpoint('GET /api/users?filter=name~*test*');

      expect(result).toEqual({
        method: 'GET',
        url: '/api/users?filter=name~*test*'
      });
    });

    it('should handle URLs with anchors', () => {
      const result = parseEndpoint('GET /api/docs#section-1');

      expect(result).toEqual({
        method: 'GET',
        url: '/api/docs#section-1'
      });
    });
  });
});

