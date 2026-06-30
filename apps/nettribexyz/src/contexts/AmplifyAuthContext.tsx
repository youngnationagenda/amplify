import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { client } from "@/integrations/amplify/client";

type AppRole = 'rider' | 'investor' | 'admin' | 'offsetter' | 'user';

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  userRole: AppRole | null;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      // First try DynamoDB
      const { data } = await client.models.UserRole.list({
        filter: { userId: { eq: userId } },
      });
      if (data && data.length > 0) {
        setUserRole(data[0].role?.toLowerCase() as AppRole);
        return;
      }

      // Fallback: read from Cognito custom:role attribute
      const attributes = await fetchUserAttributes();
      const cognitoRole = attributes['custom:role'];
      if (cognitoRole) {
        const role = cognitoRole.toLowerCase() as AppRole;
        setUserRole(role);
      } else {
        // Default to rider if no role found anywhere
        setUserRole('rider');
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
      // Default to rider on error so user isn't stuck
      setUserRole('rider');
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      // Resolve role FIRST before setting user state
      let resolvedRole: AppRole = 'rider';
      try {
        const { data } = await client.models.UserRole.list({
          filter: { userId: { eq: currentUser.userId } },
        });
        if (data && data.length > 0 && data[0].role) {
          resolvedRole = data[0].role.toLowerCase() as AppRole;
        } else {
          // Fallback to Cognito custom:role attribute
          const cognitoRole = attributes['custom:role'];
          if (cognitoRole) {
            resolvedRole = cognitoRole.toLowerCase() as AppRole;
          }
        }
      } catch (dbErr) {
        console.warn('DynamoDB UserRole query failed, using Cognito attribute:', dbErr);
        const cognitoRole = attributes['custom:role'];
        if (cognitoRole) {
          resolvedRole = cognitoRole.toLowerCase() as AppRole;
        }
      }

      // Set role first, then user — so the redirect useEffect sees both
      setUserRole(resolvedRole);
      setUser({
        id: currentUser.userId,
        email: attributes.email || '',
        fullName: attributes.name || attributes['custom:full_name'] || '',
      });
    } catch {
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          loadUser();
          break;
        case 'signedOut':
          setUser(null);
          setUserRole(null);
          break;
      }
    });

    return () => hubListener();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string = 'rider'
  ): Promise<{ error: Error | null }> => {
    try {
      await amplifySignUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: fullName,
            'custom:role': role,
          },
        },
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      await amplifySignIn({ username: email, password });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await amplifySignOut();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, userRole, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
