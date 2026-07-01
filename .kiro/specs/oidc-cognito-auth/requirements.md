# Requirements Document

## Introduction

This feature integrates OIDC-based authentication into the existing Amplify Gen 2 application using `react-oidc-context` and `oidc-client-ts`. The integration replaces the current Amplify SDK authentication calls with a standards-based OpenID Connect flow backed by the existing AWS Cognito User Pool (us-east-1_9YXVf9jkA). The existing role-based access control (admin, rider, investor, offsetter) and protected route patterns are preserved while moving to the OIDC authorization code flow with PKCE.

## Glossary

- **OIDC_Provider**: The `AuthProvider` component from `react-oidc-context` that manages the OIDC authentication lifecycle and wraps the React component tree.
- **Auth_Manager**: The application-level authentication context that exposes user state, role information, and auth actions (sign-in, sign-out) to consuming components.
- **Protected_Route**: A route wrapper component that restricts access to authenticated users with specified roles.
- **Cognito_User_Pool**: The existing AWS Cognito user pool (us-east-1_9YXVf9jkA) that serves as the OIDC identity provider.
- **OIDC_Client**: The `oidc-client-ts` library instance configured to communicate with the Cognito User Pool using the authorization code flow with PKCE.
- **Auth_Callback**: The redirect URI endpoint that receives the authorization code from Cognito after successful authentication.
- **User_Session**: The authenticated state containing ID token, access token, refresh token, and user profile claims.
- **App_Role**: One of the four application roles: admin, rider, investor, offsetter.

## Requirements

### Requirement 1: OIDC Provider Configuration

**User Story:** As a developer, I want the OIDC client configured with the Cognito user pool parameters, so that the application authenticates users via the standard OIDC authorization code flow.

#### Acceptance Criteria

1. THE OIDC_Client SHALL use "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_9YXVf9jkA" as the OIDC authority.
2. THE OIDC_Client SHALL use "7u0frbk65upesqqvd90jjaictl" as the client identifier.
3. THE OIDC_Client SHALL use "code" as the response type and SHALL enforce PKCE (Proof Key for Code Exchange) for the authorization code flow.
4. THE OIDC_Client SHALL request the scopes "aws.cognito.signin.user.admin email openid phone profile".
5. THE OIDC_Client SHALL use the current browser window origin (the protocol, hostname, and port of the running application) as the redirect URI.
6. THE OIDC_Client SHALL use the current browser window origin (the protocol, hostname, and port of the running application) as the post-logout redirect URI.
7. WHEN the application starts, THE OIDC_Client SHALL complete provider configuration before accepting any authentication requests, within 10 seconds of application initialization.
8. IF the OIDC authority endpoint is unreachable during configuration, THEN THE OIDC_Client SHALL display an error indication to the user and retry configuration up to 3 times with a 2-second delay between attempts.

### Requirement 2: Provider Integration in Component Tree

**User Story:** As a developer, I want the OIDC AuthProvider wrapping the application component tree, so that all child components have access to the authentication state.

#### Acceptance Criteria

1. THE OIDC_Provider SHALL wrap the application component tree as a parent of the router and all route components in the entry point module, positioned such that the existing Amplify `configureAmplify()` call executes before OIDC_Provider mounts.
2. WHILE the OIDC_Provider is initializing, THE OIDC_Provider SHALL prevent route components from rendering and SHALL display a loading indicator until initialization completes or a maximum of 10 seconds elapses.
3. WHEN the OIDC_Provider initializes, THE OIDC_Provider SHALL check for an existing session token in storage and for authorization callback parameters in the URL, and SHALL resolve the authentication state to either authenticated (user context available to child components) or unauthenticated (null user context) before rendering child routes.
4. IF the OIDC_Provider initialization exceeds 10 seconds without resolving authentication state, THEN THE OIDC_Provider SHALL resolve to an unauthenticated state and render the child component tree.
5. THE OIDC_Provider SHALL coexist with the existing Amplify configuration by not overwriting, re-initializing, or interfering with the Amplify SDK global state, verified by confirming that Amplify API calls (e.g., data queries) continue to function after OIDC_Provider mounts.

### Requirement 3: Authentication State Management

**User Story:** As a developer, I want a unified auth context that exposes OIDC session data and user role, so that components can access authentication state through a single interface.

#### Acceptance Criteria

1. THE Auth_Manager SHALL expose the authenticated user object containing user ID (from the OIDC `sub` claim), email (from the `email` claim), and full name (from the `name` claim) extracted from the ID token.
2. WHILE the OIDC session is being initialized, refreshed, or the App_Role is being resolved, THE Auth_Manager SHALL expose a loading state of true.
3. THE Auth_Manager SHALL expose the current App_Role for the authenticated user, set to null while role resolution is in progress.
4. IF a user is not authenticated, THEN THE Auth_Manager SHALL expose a null user value and a null App_Role.
5. THE Auth_Manager SHALL expose a signIn function that initiates the OIDC authorization code redirect.
6. THE Auth_Manager SHALL expose a signOut function that ends the OIDC session and redirects to the post-logout URI.

### Requirement 4: User Role Resolution

**User Story:** As a developer, I want user roles resolved from the backend after OIDC authentication, so that role-based access control continues to function.

#### Acceptance Criteria

1. WHEN a user successfully authenticates, THE Auth_Manager SHALL query the UserRole data model filtered by the authenticated user ID and set the App_Role to the role value of the first matching record, converted to lowercase.
2. IF the UserRole query fails due to a network or service error, THEN THE Auth_Manager SHALL set the App_Role to null.
3. IF the UserRole query returns no matching record for the authenticated user ID, THEN THE Auth_Manager SHALL set the App_Role to null.
4. WHEN a user signs out, THE Auth_Manager SHALL clear the stored App_Role by setting it to null.
5. WHILE the UserRole query is in progress, THE Auth_Manager SHALL expose the loading state as true.

### Requirement 5: Protected Route Enforcement

**User Story:** As a user, I want protected routes to remain accessible only to authenticated users with the correct role, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to a protected route, THE Protected_Route SHALL redirect the user to the authentication page using history replacement so that the protected URL is not accessible via the browser back button.
2. WHEN an authenticated user whose App_Role does not match any of the route's allowed roles navigates to a protected route, THE Protected_Route SHALL redirect the user to the authentication page using history replacement.
3. WHILE the authentication state is loading, THE Protected_Route SHALL display a visible loading indicator and SHALL NOT render the child content or perform a redirect.
4. WHEN an authenticated user with an App_Role matching one of the route's allowed roles navigates to a protected route, THE Protected_Route SHALL render the child content.
5. IF no allowed roles are specified for a protected route, THEN THE Protected_Route SHALL permit access to any authenticated user regardless of their App_Role.
6. IF an authenticated user has a null App_Role and the route specifies allowed roles, THEN THE Protected_Route SHALL redirect the user to the authentication page.

### Requirement 6: Sign-In User Interface

**User Story:** As a user, I want a sign-in button that initiates the OIDC login flow, so that I can authenticate using the Cognito hosted UI or redirect-based flow.

#### Acceptance Criteria

1. WHEN an unauthenticated user visits the authentication page, THE authentication page SHALL present a sign-in button that triggers the OIDC authorization code redirect when clicked.
2. WHEN the OIDC redirect completes successfully, THE Auth_Manager SHALL extract user profile claims (sub, email, name) from the ID token and populate the user object.
3. WHEN the OIDC redirect completes successfully and the App_Role is resolved, THE Auth_Manager SHALL redirect the user to the role-specific dashboard: admin to /admin, rider to /rider, investor to /investor, offsetter to /offsetter.
4. IF the App_Role is null after successful authentication, THEN THE Auth_Manager SHALL redirect the user to a default landing page.
5. IF the OIDC redirect fails, THEN THE authentication page SHALL display an error message describing the failure reason.

### Requirement 7: Sign-Out User Interface

**User Story:** As an authenticated user, I want a sign-out action available from the application, so that I can end my session securely.

#### Acceptance Criteria

1. WHEN an authenticated user invokes the sign-out action, THE Auth_Manager SHALL call the OIDC end-session endpoint and pass the application origin URL as the post-logout redirect URI.
2. WHEN sign-out completes, THE Auth_Manager SHALL clear all local authentication state from browser session storage, including ID token, access token, refresh token, and stored App_Role.
3. WHEN sign-out completes, THE Auth_Manager SHALL redirect the user to the application origin URL.
4. IF the OIDC end-session endpoint call fails, THEN THE Auth_Manager SHALL still clear all local authentication state and redirect the user to the application origin URL.

### Requirement 8: Token and Session Handling

**User Story:** As a developer, I want OIDC tokens managed automatically with silent refresh, so that user sessions persist without manual re-authentication.

#### Acceptance Criteria

1. THE OIDC_Client SHALL store the ID token, access token, and refresh token in browser session storage.
2. WHEN the access token is within 60 seconds of expiration, THE OIDC_Client SHALL attempt a silent token refresh using the refresh token.
3. IF silent token refresh fails, THEN THE Auth_Manager SHALL clear stored tokens from session storage and set the user state to unauthenticated.
4. WHEN the application loads with a non-expired access token or a non-expired refresh token in storage, THE OIDC_Client SHALL restore the authenticated session without requiring a redirect.
5. WHILE an active sign-out is in progress, THE OIDC_Client SHALL not attempt automatic token refresh.

### Requirement 9: Callback Handling

**User Story:** As a developer, I want the OIDC callback processed seamlessly, so that users return to the application in an authenticated state after the Cognito redirect.

#### Acceptance Criteria

1. WHEN the application receives an authorization code via the redirect URI, THE OIDC_Client SHALL validate the state parameter against the stored value and exchange the code for tokens using PKCE verification within 10 seconds.
2. WHEN token exchange succeeds, THE OIDC_Provider SHALL update the authentication state and remove the authorization code, state, and session state parameters from the browser URL using history replacement so that a page refresh does not re-trigger the token exchange.
3. IF token exchange fails, THEN THE OIDC_Provider SHALL set the user state to unauthenticated and expose the error reason through the Auth_Manager error state accessible to consuming components.
4. IF the state parameter in the callback URL does not match the stored state value, THEN THE OIDC_Client SHALL reject the callback, set the user state to unauthenticated, and expose an error indicating a state mismatch.

### Requirement 10: Dependency Installation

**User Story:** As a developer, I want `oidc-client-ts` and `react-oidc-context` added as project dependencies, so that the OIDC integration has the required libraries available.

#### Acceptance Criteria

1. THE application package manifest at `apps/nettribexyz/package.json` SHALL include `oidc-client-ts` as a production dependency with a caret range version specifier.
2. THE application package manifest at `apps/nettribexyz/package.json` SHALL include `react-oidc-context` as a production dependency with a caret range version specifier.
3. THE application SHALL use `oidc-client-ts` version 3.x or later.
4. THE application SHALL use `react-oidc-context` version 3.x or later.
