import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useAuth as useOidcLibAuth } from "react-oidc-context";
import { client } from "@/integrations/amplify/client";

// --- Public Types ---

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

export type AppRole = "rider" | "investor" | "admin" | "offsetter";

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  userRole: AppRole | null;
  signIn: () => void;
  signOut: () => void;
  error: string | null;
}

// --- Pure helper (exported for testing) ---

/**
 * Maps OIDC ID token claims to an AuthUser object.
 * Exported as a pure function so it can be tested independently.
 */
export function extractUser(
  claims: Record<string, unknown>
): AuthUser {
  return {
    id: String(claims.sub ?? ""),
    email: String(claims.email ?? ""),
    fullName: claims.name ? String(claims.name) : undefined,
  };
}

// --- Context ---

const OidcAuthContext = createContext<AuthContextType | undefined>(undefined);

const INIT_TIMEOUT_MS = 10_000;

export const OidcAuthProvider = ({ children }: { children: ReactNode }) => {
  const oidcAuth = useOidcLibAuth();

  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const roleQueryAbort = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initialization timeout ---
  useEffect(() => {
    if (oidcAuth.isLoading && !timedOut) {
      timeoutRef.current = setTimeout(() => {
        setTimedOut(true);
      }, INIT_TIMEOUT_MS);
    }

    // Clear timeout when loading finishes
    if (!oidcAuth.isLoading && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [oidcAuth.isLoading, timedOut]);

  // --- Role resolution ---
  useEffect(() => {
    const sub = oidcAuth.user?.profile?.sub;

    if (!sub) {
      // No authenticated user — clear role
      setUserRole(null);
      setRoleLoading(false);
      return;
    }

    // Abort any in-flight role query
    if (roleQueryAbort.current) {
      roleQueryAbort.current.abort();
    }
    const abortController = new AbortController();
    roleQueryAbort.current = abortController;

    const fetchRole = async () => {
      setRoleLoading(true);
      try {
        const { data } = await client.models.UserRole.list({
          filter: { userId: { eq: sub } },
        });

        if (abortController.signal.aborted) return;

        if (data && data.length > 0) {
          setUserRole(data[0].role?.toLowerCase() as AppRole);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        if (abortController.signal.aborted) return;
        console.error("Failed to fetch user role:", err);
        setUserRole(null);
      } finally {
        if (!abortController.signal.aborted) {
          setRoleLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      abortController.abort();
    };
  }, [oidcAuth.user?.profile?.sub]);

  // --- Derived state ---
  const isOidcLoading = oidcAuth.isLoading && !timedOut;
  const loading = isOidcLoading || roleLoading;

  const user: AuthUser | null =
    oidcAuth.user?.profile
      ? extractUser(oidcAuth.user.profile as Record<string, unknown>)
      : null;

  const error: string | null = oidcAuth.error
    ? oidcAuth.error.message || "Authentication error"
    : null;

  // --- Actions ---
  const signIn = useCallback(() => {
    oidcAuth.signinRedirect();
  }, [oidcAuth]);

  const signOut = useCallback(async () => {
    // Clear local role state immediately
    setUserRole(null);

    try {
      await oidcAuth.signoutRedirect({
        post_logout_redirect_uri: window.location.origin,
      });
    } catch (err) {
      // Even if the end-session endpoint fails, local cleanup still occurs.
      console.error("Sign-out redirect failed:", err);
    }
  }, [oidcAuth]);

  return (
    <OidcAuthContext.Provider
      value={{ user, loading, userRole, signIn, signOut, error }}
    >
      {children}
    </OidcAuthContext.Provider>
  );
};

export const useOidcAuth = () => {
  const context = useContext(OidcAuthContext);
  if (context === undefined) {
    throw new Error("useOidcAuth must be used within an OidcAuthProvider");
  }
  return context;
};
