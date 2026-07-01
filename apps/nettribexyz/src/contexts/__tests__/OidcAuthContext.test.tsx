import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractUser, OidcAuthProvider, useOidcAuth } from "../OidcAuthContext";

// --- Mocks ---

const mockSigninRedirect = vi.fn();
const mockSignoutRedirect = vi.fn();

const defaultOidcAuth = {
  user: null,
  isLoading: false,
  error: null,
  signinRedirect: mockSigninRedirect,
  signoutRedirect: mockSignoutRedirect,
  isAuthenticated: false,
};

vi.mock("react-oidc-context", () => ({
  useAuth: vi.fn(() => defaultOidcAuth),
}));

vi.mock("@/integrations/amplify/client", () => ({
  client: {
    models: {
      UserRole: {
        list: vi.fn(() => Promise.resolve({ data: [] })),
      },
    },
  },
}));

// Import after mocks are defined
import { useAuth as useOidcLibAuth } from "react-oidc-context";
import { client } from "@/integrations/amplify/client";

const mockedUseOidcLibAuth = vi.mocked(useOidcLibAuth);
const mockedUserRoleList = vi.mocked(client.models.UserRole.list);

// --- Helper to consume context ---

function TestConsumer() {
  const auth = useOidcAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : "null"}</span>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="role">{auth.userRole ?? "null"}</span>
      <span data-testid="error">{auth.error ?? "null"}</span>
      <button data-testid="sign-in" onClick={auth.signIn}>Sign In</button>
      <button data-testid="sign-out" onClick={auth.signOut}>Sign Out</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <OidcAuthProvider>
      <TestConsumer />
    </OidcAuthProvider>
  );
}

// --- Tests ---

describe("extractUser (pure function)", () => {
  it("maps sub, email, and name claims to AuthUser", () => {
    const claims = { sub: "user-123", email: "test@example.com", name: "John Doe" };
    const result = extractUser(claims);

    expect(result).toEqual({
      id: "user-123",
      email: "test@example.com",
      fullName: "John Doe",
    });
  });

  it("handles missing name claim by setting fullName to undefined", () => {
    const claims = { sub: "user-456", email: "no-name@example.com" };
    const result = extractUser(claims);

    expect(result).toEqual({
      id: "user-456",
      email: "no-name@example.com",
      fullName: undefined,
    });
  });

  it("handles missing sub and email by coercing to empty strings", () => {
    const claims = {};
    const result = extractUser(claims);

    expect(result).toEqual({
      id: "",
      email: "",
      fullName: undefined,
    });
  });
});

describe("OidcAuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseOidcLibAuth.mockReturnValue(defaultOidcAuth as any);
    mockedUserRoleList.mockResolvedValue({ data: [] } as any);
  });

  describe("when OIDC user is available with role query success", () => {
    it("sets userRole to the lowercase role value", async () => {
      mockedUseOidcLibAuth.mockReturnValue({
        ...defaultOidcAuth,
        user: {
          profile: { sub: "abc-123", email: "user@test.com", name: "Test User" },
        },
        isAuthenticated: true,
      } as any);

      mockedUserRoleList.mockResolvedValue({
        data: [{ role: "ADMIN", userId: "abc-123" }],
      } as any);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId("role").textContent).toBe("admin");
      });
    });
  });

  describe("when role query fails (error thrown)", () => {
    it("sets userRole to null", async () => {
      mockedUseOidcLibAuth.mockReturnValue({
        ...defaultOidcAuth,
        user: {
          profile: { sub: "abc-123", email: "user@test.com", name: "Test User" },
        },
        isAuthenticated: true,
      } as any);

      mockedUserRoleList.mockRejectedValue(new Error("Network error"));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId("role").textContent).toBe("null");
      });
    });
  });

  describe("when no OIDC user (unauthenticated)", () => {
    it("exposes null user and null role", () => {
      mockedUseOidcLibAuth.mockReturnValue({
        ...defaultOidcAuth,
        user: null,
        isAuthenticated: false,
      } as any);

      renderWithProvider();

      expect(screen.getByTestId("user").textContent).toBe("null");
      expect(screen.getByTestId("role").textContent).toBe("null");
    });
  });

  describe("loading state", () => {
    it("is true while OIDC is initializing (isLoading = true)", () => {
      mockedUseOidcLibAuth.mockReturnValue({
        ...defaultOidcAuth,
        isLoading: true,
      } as any);

      renderWithProvider();

      expect(screen.getByTestId("loading").textContent).toBe("true");
    });
  });

  describe("signIn", () => {
    it("calls signinRedirect on the OIDC auth object", () => {
      mockedUseOidcLibAuth.mockReturnValue({
        ...defaultOidcAuth,
      } as any);

      renderWithProvider();

      act(() => {
        screen.getByTestId("sign-in").click();
      });

      expect(mockSigninRedirect).toHaveBeenCalledTimes(1);
    });
  });

  describe("signOut", () => {
    it("calls signoutRedirect on the OIDC auth object", async () => {
      mockSignoutRedirect.mockResolvedValue(undefined);
      mockedUseOidcLibAuth.mockReturnValue({
        ...defaultOidcAuth,
        user: {
          profile: { sub: "abc-123", email: "user@test.com", name: "Test User" },
        },
        isAuthenticated: true,
      } as any);

      renderWithProvider();

      act(() => {
        screen.getByTestId("sign-out").click();
      });

      await waitFor(() => {
        expect(mockSignoutRedirect).toHaveBeenCalledTimes(1);
        expect(mockSignoutRedirect).toHaveBeenCalledWith(
          expect.objectContaining({ post_logout_redirect_uri: expect.any(String) })
        );
      });
    });
  });

  describe("error state", () => {
    it("exposes OIDC error message when oidcAuth.error is set", () => {
      mockedUseOidcLibAuth.mockReturnValue({
        ...defaultOidcAuth,
        error: { message: "Token expired", name: "OidcError" },
      } as any);

      renderWithProvider();

      expect(screen.getByTestId("error").textContent).toBe("Token expired");
    });
  });
});
