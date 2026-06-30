import { useNavigate } from "react-router-dom";
import { Leaf, Bike, TrendingUp, Flame, ShoppingCart, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const portals = [
  {
    id: "rider",
    title: "Rider Portal",
    subtitle: "Earn credits by riding",
    icon: Bike,
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30 hover:border-green-500",
    route: "/auth/rider",
  },
  {
    id: "investor",
    title: "Investor Portal",
    subtitle: "Fund & earn ROI",
    icon: TrendingUp,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30 hover:border-blue-500",
    route: "/auth/investor",
  },
  {
    id: "offsetter",
    title: "Offsetter Portal",
    subtitle: "Buy & burn credits",
    icon: Flame,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30 hover:border-orange-500",
    route: "/auth/offsetter",
  },
  {
    id: "user",
    title: "User Portal",
    subtitle: "Trade carbon credits",
    icon: ShoppingCart,
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30 hover:border-purple-500",
    route: "/auth/user",
  },
];

const PortalSelect = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  // If already logged in, redirect to the appropriate dashboard
  useEffect(() => {
    if (!loading && user && userRole) {
      const roleRedirects: Record<string, string> = {
        rider: "/rider-dashboard",
        investor: "/investor-portal",
        offsetter: "/offsetter-dashboard",
        user: "/user-dashboard",
      };
      navigate(roleRedirects[userRole] || "/rider-dashboard");
    }
  }, [user, userRole, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2 mb-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Leaf className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-2xl gradient-text">
          Net Tribe Carbon
        </span>
      </a>

      {/* Heading */}
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold mb-2">
          Choose Your Portal
        </h1>
        <p className="text-muted-foreground max-w-md">
          Select the portal that matches your role to sign in or create an account.
        </p>
      </div>

      {/* Portal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {portals.map((portal) => (
          <button
            key={portal.id}
            onClick={() => navigate(portal.route)}
            className={`group relative flex items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 ${portal.borderColor} ${portal.bgColor} hover:shadow-lg`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.color} flex items-center justify-center shrink-0`}>
              <portal.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">{portal.title}</div>
              <div className="text-sm text-muted-foreground">{portal.subtitle}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-10 text-sm text-muted-foreground">
        Join the green mobility revolution. Every kilometer counts.
      </p>
    </div>
  );
};

export default PortalSelect;
