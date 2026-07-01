import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

function renderProtectedRoute(allowedRoles?: ('rider' | 'investor' | 'admin' | 'offsetter')[]) {
  return render(
    <MemoryRouter>
      <ProtectedRoute allowedRoles={allowedRoles}>
        <div data-testid="child-content">Protected Content</div>
      </ProtectedRoute>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirements 5.1
   */
  it('shows loading indicator when loading is true', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      error: null,
    });

    renderProtectedRoute(['rider']);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  /**
   * Validates: Requirements 5.2
   */
  it('redirects to /auth when user is null (unauthenticated)', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      userRole: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      error: null,
    });

    renderProtectedRoute(['rider']);

    expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true });
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  /**
   * Validates: Requirements 5.3
   */
  it('redirects to /auth when authenticated user has a role not in allowedRoles', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      userRole: 'investor',
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      error: null,
    });

    renderProtectedRoute(['rider', 'admin']);

    expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true });
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  /**
   * Validates: Requirements 5.6
   */
  it('redirects to /auth when authenticated user has null userRole and allowedRoles is specified', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      userRole: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      error: null,
    });

    renderProtectedRoute(['rider', 'admin']);

    expect(mockNavigate).toHaveBeenCalledWith('/auth', { replace: true });
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  /**
   * Validates: Requirements 5.4, 5.5
   */
  it('renders children when authenticated user has a role matching allowedRoles', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      userRole: 'rider',
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      error: null,
    });

    renderProtectedRoute(['rider', 'admin']);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  /**
   * Validates: Requirements 5.5
   */
  it('allows any authenticated user when allowedRoles is not specified', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      userRole: 'offsetter',
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      error: null,
    });

    renderProtectedRoute();

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
