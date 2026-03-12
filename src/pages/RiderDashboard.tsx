import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bike, Leaf, Zap, LogOut, User, TrendingUp } from "lucide-react";
import LiveRideSection from "@/components/rider/LiveRideSection";
import RiderLeaderboard from "@/components/rider/RiderLeaderboard";
import WalletPanel from "@/components/wallet/WalletPanel";

// Simulated real-time data
const useRideSimulation = () => {
  const [isRiding, setIsRiding] = useState(false);
  const [distance, setDistance] = useState(0);
  const [credits, setCredits] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [battery, setBattery] = useState(85);
  const [efficiency, setEfficiency] = useState(92);

  useEffect(() => {
    if (!isRiding) return;
    const interval = setInterval(() => {
      const newDistance = Math.random() * 0.4 + 0.1;
      setDistance(prev => prev + newDistance);
      const efficiencyMultiplier = efficiency / 100;
      const newCredits = (newDistance / 1000) * efficiencyMultiplier * 4.8;
      setCredits(prev => prev + newCredits);
      setSpeed(Math.floor(Math.random() * 40 + 20));
      setBattery(prev => Math.max(0, prev - 0.01));
      setEfficiency(Math.min(100, Math.max(70, efficiency + (Math.random() - 0.5) * 2)));
    }, 100);
    return () => clearInterval(interval);
  }, [isRiding, efficiency]);

  return { isRiding, setIsRiding, distance, credits, speed, battery, efficiency };
};

const RiderDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { isRiding, setIsRiding, distance, credits, speed, battery, efficiency } = useRideSimulation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?portal=rider");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-lg gradient-text">Net Tribe Carbon</span>
              <p className="text-xs text-muted-foreground">Rider Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Live Ride Section */}
        <LiveRideSection
          isRiding={isRiding}
          setIsRiding={setIsRiding}
          distance={distance}
          credits={credits}
          speed={speed}
          battery={battery}
          efficiency={efficiency}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bike className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold">Total Rides</h3>
            </div>
            <div className="font-display text-3xl font-bold mb-2">47</div>
            <p className="text-sm text-green-500">+12% this week</p>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-display font-bold">Total Credits</h3>
            </div>
            <div className="font-display text-3xl font-bold mb-2">4.8</div>
            <p className="text-sm text-muted-foreground">tCO₂e lifetime</p>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-display font-bold">Earnings</h3>
            </div>
            <div className="font-display text-3xl font-bold mb-2">$480</div>
            <p className="text-sm text-muted-foreground">$100 per credit</p>
          </div>
        </div>

        {/* Wallet & DeFi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">💰</span> Wallet & DeFi
            </h3>
            <WalletPanel />
          </div>
          <div>
            <RiderLeaderboard currentUserId={user?.id} />
          </div>
        </div>

        {/* IoT Status */}
        <div className="glass-card p-6">
          <h3 className="font-display text-xl font-bold mb-4">IoT Device Status</h3>
          <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="font-medium text-green-500">Device Connected</p>
              <p className="text-sm text-muted-foreground">IoT ID: NTC-MC-0042 • Last sync: Just now</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500">Validating</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RiderDashboard;
