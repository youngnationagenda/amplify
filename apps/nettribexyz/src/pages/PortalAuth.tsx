import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Leaf, Mail, Lock, User, ArrowRight, ArrowLeft,
  Bike, TrendingUp, Flame, ShoppingCart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
});

// Portal configuration
const portalConfig: Record<string, {
  title: string;
  subtitle: string;
  signupSubtitle: string;
  icon: typeof Bike;
  gradient: string;
  panelGradient: string;
  role: string;
  dashboard: string;
  demoEmail: string;
  demoPassword: string;
  demoName: string;
  stats: { label: string; value: string }[];
  description: string;
}> = {
  rider: {
    title: "Rider Login",
    subtitle: "Sign in to track your rides and earn carbon credits",
    signupSubtitle: "Start earning carbon credits with every ride",
    icon: Bike,
    gradient: "from-green-500 to-emerald-600",
    panelGradient: "from-green-500/20 via-background to-emerald-500/20",
    role: "rider",
    dashboard: "/rider-dashboard",
    demoEmail: "rider@nettribe.demo",
    demoPassword: "RiderDemo123!",
    demoName: "Alex Rider",
    stats: [
      { label: "Active Riders", value: "120" },
      { label: "Credits Earned", value: "2,340" },
    ],
    description: "Track your electric motorcycle rides and earn verified carbon credits through IoT validation.",
  },
  investor: {
    title: "Investor Login",
    subtitle: "Sign in to manage your carbon credit investments",
    signupSubtitle: "Fund carbon credit projects and earn ROI",
    icon: TrendingUp,
    gradient: "from-blue-500 to-indigo-600",
    panelGradient: "from-blue-500/20 via-background to-indigo-500/20",
    role: "investor",
    dashboard: "/investor-portal",
    demoEmail: "investor@nettribe.demo",
    demoPassword: "InvestorDemo123!",
    demoName: "Jordan Capital",
    stats: [
      { label: "Total Invested", value: "$45K" },
      { label: "Avg ROI", value: "18%" },
    ],
    description: "Fund initial carbon offerings and earn returns as credits are verified and traded.",
  },
  offsetter: {
    title: "Offsetter Login",
    subtitle: "Sign in to offset your carbon footprint",
    signupSubtitle: "Buy and burn carbon credits to offset emissions",
    icon: Flame,
    gradient: "from-orange-500 to-red-600",
    panelGradient: "from-orange-500/20 via-background to-red-500/20",
    role: "offsetter",
    dashboard: "/offsetter-dashboard",
    demoEmail: "offsetter@nettribe.demo",
    demoPassword: "OffsetterDemo123!",
    demoName: "GreenCorp Ltd",
    stats: [
      { label: "Credits Burned", value: "890" },
      { label: "CO₂ Offset", value: "445t" },
    ],
    description: "Purchase verified carbon credits and permanently retire them to offset your organization's emissions.",
  },
  user: {
    title: "User Login",
    subtitle: "Sign in to trade carbon credits on the marketplace",
    signupSubtitle: "Join the carbon credit marketplace",
    icon: ShoppingCart,
    gradient: "from-purple-500 to-violet-600",
    panelGradient: "from-purple-500/20 via-background to-violet-500/20",
    role: "user",
    dashboard: "/user-dashboard",
    demoEmail: "user@nettribe.demo",
    demoPassword: "UserDemo123!",
    demoName: "Sam Trader",
    stats: [
      { label: "Credits Traded", value: "1,200" },
      { label: "Market Volume", value: "$120K" },
    ],
    description: "Buy, sell, and trade verified carbon credits on the open marketplace.",
  },
};

const PortalAuth = () => {
  const { portal } = useParams<{ portal: string }>();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const config = portalConfig[portal || "rider"] || portalConfig.rider;
  const PortalIcon = config.icon;

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(config.dashboard);
    }
  }, [user, loading, navigate, config.dashboard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          toast({
            title: "Validation Error",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message === "Invalid login credentials"
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: `You have successfully logged in to the ${config.title.replace(" Login", "")} portal.`,
          });
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, fullName });
        if (!validation.success) {
          toast({
            title: "Validation Error",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, config.role);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: `Welcome to Net Tribe Carbon ${config.title.replace(" Login", "")} portal.`,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail(config.demoEmail);
    setPassword(config.demoPassword);
    if (!isLogin) {
      setFullName(config.demoName);
    }
    toast({
      title: "Demo Credentials Filled",
      description: `Using demo ${config.role} account credentials.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back to portal select */}
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portal selection
          </Link>

          {/* Portal Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
              <PortalIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl">
                {config.title}
              </span>
              <div className="text-xs text-muted-foreground">Net Tribe Carbon</div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? config.subtitle : config.signupSubtitle}
            </p>
          </div>

          {/* Demo Credentials Button */}
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="w-full mb-5 p-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all text-sm text-center"
          >
            <span className="font-medium text-primary">🧪 Use Demo Credentials</span>
            <br />
            <span className="text-xs text-muted-foreground">
              {config.demoEmail} / {config.demoPassword}
            </span>
          </button>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="glow"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className={`hidden lg:flex flex-1 bg-gradient-to-br ${config.panelGradient} items-center justify-center p-12 relative overflow-hidden`}>
        <div className="hero-glow top-1/4 left-1/4 animate-pulse-glow" />
        <div className="hero-glow bottom-1/4 right-1/4 animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 text-center max-w-md">
          <div className="glass-card p-8 mb-8">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mx-auto mb-4`}>
              <PortalIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">
              {config.title.replace(" Login", "")} Portal
            </h2>
            <p className="text-muted-foreground mb-6">
              {config.description}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {config.stats.map((stat) => (
                <div key={stat.label} className="p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
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

export default PortalAuth;
