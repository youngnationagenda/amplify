import { createRoot } from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import { configureAmplify } from "./integrations/amplify/config";
import { oidcConfig } from "./integrations/oidc/config";
import { OidcAuthProvider } from "./contexts/OidcAuthContext";
import App from "./App.tsx";
import "./index.css";

// Initialize Amplify before rendering (data layer only)
configureAmplify();

/**
 * After OIDC sign-in callback, remove authorization code artifacts
 * (code, state, session_state) from the URL to keep it clean.
 */
const onSigninCallback = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("session_state");
  window.history.replaceState({}, document.title, url.toString());
};

createRoot(document.getElementById("root")!).render(
  <AuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
    <OidcAuthProvider>
      <App />
    </OidcAuthProvider>
  </AuthProvider>
);
