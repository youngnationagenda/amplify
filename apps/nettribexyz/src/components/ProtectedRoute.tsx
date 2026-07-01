import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "rider" | "investor" | "admin" | "offsetter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
      navigate("/auth", { replace: true });
    }
  }, [user, userRole, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) return null;

  return <>{children}</>;
};

export default ProtectedRoute;