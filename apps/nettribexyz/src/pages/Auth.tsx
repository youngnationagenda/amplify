import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Mail, Lock, User, ArrowRight, Bike, TrendingUp, Flame, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState("rider");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

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
          "investor-portal": "/investor-portal",
        };
        navigate(portalRedirects[portal] || "/rider-dashboard");
        return;
      }

      // Otherwise, wait for role and redirect based on role
      if (userRole === null) return;
      
      if (userRole === 'investor') {
        navigate("/investor-portal");
      } else if (userRole === 'offsetter') {
        navigate("/offsetter-dashboard");
      } else {
        navigate("/rider-dashboard");
      }
    }
  }, [user, loading, userRole, portal, navigate]);

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
            variant: "destructive"
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
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in."
          });
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, fullName });
        if (!validation.success) {
          toast({
            title: "Validation Error",
            description: validation.error.errors[0].message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Signup Failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome to Net Tribe Carbon. You are now logged in."
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
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
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Sign in to access your dashboard" 
                : "Join Net Tribe Carbon and start earning carbon credits"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
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

                <div className="space-y-3">
                  <Label>I am signing up as</Label>
                  <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-2 gap-3">
                    {[
                      { value: "rider", label: "Rider", icon: Bike, desc: "Earn credits by riding" },
                      { value: "investor", label: "Investor", icon: TrendingUp, desc: "Fund & earn ROI" },
                      { value: "offsetter", label: "Offsetter", icon: Flame, desc: "Buy & burn credits" },
                      { value: "user", label: "User", icon: ShoppingCart, desc: "Trade carbon credits" },
                    ].map((role) => (
                      <Label
                        key={role.value}
                        htmlFor={`role-${role.value}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRole === role.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={role.value} id={`role-${role.value}`} className="sr-only" />
                        <role.icon className={`w-5 h-5 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <div className="font-medium text-sm">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.desc}</div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </>
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
