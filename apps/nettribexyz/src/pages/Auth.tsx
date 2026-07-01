import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight } from "lucide-react";

const Auth = () => {
  const { user, loading, userRole, signIn, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read the portal context from query param
  const portal = searchParams.get("portal") || null;

  useEffect(() => {
    if (!loading && user) {
      // If portal param is set, redirect directly to that portal
      if (portal) {
        const portalRedirects: Record<string, string> = {
          rider: "/rider-dashboard",
          investor: "/investor-portal",
          offsetter: "/offsetter-dashboard",
          admin: "/admin",
          "investor-portal": "/investor-portal",
        };
        navigate(portalRedirects[portal] || "/rider-dashboard");
        return;
      }

      // If userRole is null after authentication, redirect to default landing page
      if (userRole === null) {
        navigate("/");
        return;
      }

      // Redirect based on resolved role
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "rider") {
        navigate("/rider-dashboard");
      } else if (userRole === "investor") {
        navigate("/investor-portal");
      } else if (userRole === "offsetter") {
        navigate("/offsetter-dashboard");
      }
    }
  }, [user, loading, userRole, portal, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Sign In */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl gradient-text">
              Net Tribe Carbon
            </span>
          </a>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <Button
            variant="glow"
            className="w-full"
            size="lg"
            onClick={() => signIn()}
          >
            Sign In
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-background to-secondary/20 items-center justify-center p-12 relative overflow-hidden">
        <div className="hero-glow top-1/4 left-1/4 animate-pulse-glow" />
        <div className="hero-glow bottom-1/4 right-1/4 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        
        <div className="relative z-10 text-center max-w-md">
          <div className="glass-card p-8 mb-8">
            <h2 className="font-display text-2xl font-bold mb-4">
              576 Carbon Credits Available
            </h2>
            <p className="text-muted-foreground mb-6">
              From 120 electric motorcycles generating verified carbon credits through IoT validation.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">120</div>
                <div className="text-sm text-muted-foreground">Active Riders</div>
              </div>
              <div className="p-4 bg-secondary/10 rounded-lg">
                <div className="text-2xl font-bold text-secondary">576</div>
                <div className="text-sm text-muted-foreground">Credits Generated</div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Join the green mobility revolution. Every kilometer counts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
