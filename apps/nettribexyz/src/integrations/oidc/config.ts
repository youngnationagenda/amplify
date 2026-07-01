import { WebStorageStateStore } from 'oidc-client-ts';
import type { UserManagerSettings } from 'oidc-client-ts';

export const oidcConfig: UserManagerSettings = {
  authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_9YXVf9jkA',
  client_id: '7u0frbk65upesqqvd90jjaictl',
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'aws.cognito.signin.user.admin email openid phone profile',
  automaticSilentRenew: true,
  accessTokenExpiringNotificationTimeInSeconds: 60,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
};
