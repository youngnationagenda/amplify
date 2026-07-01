import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock oidc-client-ts WebStorageStateStore before importing config
vi.mock('oidc-client-ts', () => ({
  WebStorageStateStore: vi.fn().mockImplementation(({ store }) => ({
    store,
  })),
}));

describe('OIDC Config', () => {
  let oidcConfig: typeof import('../config').oidcConfig;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('../config');
    oidcConfig = module.oidcConfig;
  });

  it('should set authority to the Cognito user pool endpoint', () => {
    expect(oidcConfig.authority).toBe(
      'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_9YXVf9jkA'
    );
  });

  it('should set client_id to the Cognito app client ID', () => {
    expect(oidcConfig.client_id).toBe('7u0frbk65upesqqvd90jjaictl');
  });

  it('should set response_type to code', () => {
    expect(oidcConfig.response_type).toBe('code');
  });

  it('should set scope to include all required Cognito scopes', () => {
    expect(oidcConfig.scope).toBe(
      'aws.cognito.signin.user.admin email openid phone profile'
    );
  });

  it('should set redirect_uri to window.location.origin', () => {
    expect(oidcConfig.redirect_uri).toBe(window.location.origin);
  });

  it('should set post_logout_redirect_uri to window.location.origin', () => {
    expect(oidcConfig.post_logout_redirect_uri).toBe(window.location.origin);
  });

  it('should enable automaticSilentRenew', () => {
    expect(oidcConfig.automaticSilentRenew).toBe(true);
  });

  it('should set accessTokenExpiringNotificationTimeInSeconds to 60', () => {
    expect(oidcConfig.accessTokenExpiringNotificationTimeInSeconds).toBe(60);
  });

  it('should configure userStore', () => {
    expect(oidcConfig.userStore).toBeDefined();
  });
});
