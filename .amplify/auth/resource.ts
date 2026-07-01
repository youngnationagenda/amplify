import { defineAuth } from '@aws-amplify/backend';

/**
 * Auth configuration with Cognito.
 * Supports roles: rider, investor, admin, offsetter
 * Role is stored as a custom attribute and also in the UserRole model.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    fullname: {
      required: true,
      mutable: true,
    },
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
  },
  groups: ['admin', 'rider', 'investor', 'offsetter'],
});
