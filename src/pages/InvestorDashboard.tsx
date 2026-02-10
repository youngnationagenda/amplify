import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Leaf, LogOut, User, TrendingUp, Coins, PieChart, 
  BarChart3, DollarSign, Bike, ArrowUpRight, ArrowDownRight,
  Wallet, Clock, Target, ExternalLink
} from "lucide-react";

// Simulated investment data
const useInvestmentData = () => {
  const [data, setData] = useState({
    eotTokens: 1250,
    tokenValue: 12.50,
    totalInvested: 10000,
    currentValue: 15625,
    carbonCreditsGenerated: 576,
    motorcyclesOwned: 5,
    activeRiders: 5,
    monthlyReturns: [8.2, 12.5, 15.3, 10.8, 18.2, 22.5],
    portfolioAllocation: {
      eotTokens: 60,
      carbonCredits: 25,
      stakingRewards: 15
    }
  });

  // Simulate real-time token value fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        tokenValue: prev.tokenValue + (Math.random() - 0.48) * 0.1,
        currentValue: prev.eotTokens * (prev.tokenValue + (Math.random() - 0.48) * 0.1)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return data;
};

const InvestorDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const investmentData = useInvestmentData();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
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

  const roi = ((investmentData.currentValue - investmentData.totalInvested) / investmentData.totalInvested) * 100;
  const isPositiveRoi = roi >= 0;

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
              <p className="text-xs text-muted-foreground">Investor Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/investor-portal")}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Investor Portal
            </Button>
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
        {/* Portfolio Overview */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-1">Portfolio Overview</h2>
              <p className="text-muted-foreground">Track your EOT token holdings and returns</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${isPositiveRoi ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                {isPositiveRoi ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(roi).toFixed(2)}% ROI
              </div>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">EOT Tokens</span>
              </div>
              <div className="font-display text-2xl font-bold">
                {investmentData.eotTokens.toLocaleString()}
              </div>
            </div>
            
            <div className="p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-secondary" />
                <span className="text-sm text-muted-foreground">Token Value</span>
              </div>
              <div className="font-display text-2xl font-bold">
                ${investmentData.tokenValue.toFixed(2)}
              </div>
            </div>
            
            <div className="p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Total Invested</span>
              </div>
              <div className="font-display text-2xl font-bold">
                ${investmentData.totalInvested.toLocaleString()}
              </div>
            </div>
            
            <div className="p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">Current Value</span>
              </div>
              <div className="font-display text-2xl font-bold gradient-text">
                ${investmentData.currentValue.toFixed(0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Portfolio Value Card */}
          <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Total Portfolio Value</h3>
                  <p className="text-sm text-muted-foreground">Real-time valuation</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold gradient-text">
                  ${investmentData.currentValue.toFixed(2)}
                </div>
                <div className={`text-sm ${isPositiveRoi ? 'text-success' : 'text-destructive'}`}>
                  {isPositiveRoi ? '+' : ''}{(investmentData.currentValue - investmentData.totalInvested).toFixed(2)} ({roi.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold">Portfolio Allocation</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">EOT Tokens</span>
                  <span className="text-sm font-medium">{investmentData.portfolioAllocation.eotTokens}%</span>
                </div>
                <Progress value={investmentData.portfolioAllocation.eotTokens} className="h-3" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Carbon Credits</span>
                  <span className="text-sm font-medium">{investmentData.portfolioAllocation.carbonCredits}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary rounded-full transition-all" 
                    style={{ width: `${investmentData.portfolioAllocation.carbonCredits}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Staking Rewards</span>
                  <span className="text-sm font-medium">{investmentData.portfolioAllocation.stakingRewards}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all" 
                    style={{ width: `${investmentData.portfolioAllocation.stakingRewards}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-display text-xl font-bold">Monthly Returns</h3>
            </div>
            
            <div className="flex items-end gap-2 h-40">
              {investmentData.monthlyReturns.map((returnVal, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(returnVal / 25) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {['J', 'F', 'M', 'A', 'M', 'J'][index]}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Monthly Return</span>
                <span className="text-sm font-medium text-success">
                  +{(investmentData.monthlyReturns.reduce((a, b) => a + b, 0) / investmentData.monthlyReturns.length).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold">Carbon Credits</h3>
            </div>
            <div className="font-display text-3xl font-bold mb-2">{investmentData.carbonCreditsGenerated}</div>
            <p className="text-sm text-muted-foreground">tCO₂e generated from fleet</p>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credit Value</span>
                <span className="font-medium text-success">$57,600</span>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Bike className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-display font-bold">Fleet Ownership</h3>
            </div>
            <div className="font-display text-3xl font-bold mb-2">{investmentData.motorcyclesOwned}</div>
            <p className="text-sm text-muted-foreground">electric motorcycles owned</p>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fleet Share</span>
                <span className="font-medium">{((investmentData.motorcyclesOwned / 120) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-display font-bold">Active Riders</h3>
            </div>
            <div className="font-display text-3xl font-bold mb-2">{investmentData.activeRiders}</div>
            <p className="text-sm text-muted-foreground">riders on your fleet</p>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Utilization</span>
                <span className="font-medium text-success">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-display text-xl font-bold">Recent Activity</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { type: 'credit', action: 'Carbon Credit Generated', amount: '+0.48 tCO₂e', time: '2 mins ago', icon: Leaf },
              { type: 'dividend', action: 'Token Dividend Received', amount: '+$125.00', time: '1 hour ago', icon: DollarSign },
              { type: 'stake', action: 'Staking Reward', amount: '+50 EOT', time: '3 hours ago', icon: Coins },
              { type: 'credit', action: 'Carbon Credit Generated', amount: '+1.2 tCO₂e', time: '5 hours ago', icon: Leaf },
              { type: 'ride', action: 'Fleet Ride Completed', amount: '45 km', time: '6 hours ago', icon: Bike },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-background/50 rounded-xl border border-border/50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'credit' ? 'bg-primary/20 text-primary' :
                  activity.type === 'dividend' ? 'bg-success/20 text-success' :
                  activity.type === 'stake' ? 'bg-secondary/20 text-secondary' :
                  'bg-warning/20 text-warning'
                }`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
                <span className={`font-medium ${
                  activity.amount.startsWith('+') && activity.amount.includes('$') ? 'text-success' :
                  activity.amount.startsWith('+') ? 'text-primary' : ''
                }`}>
                  {activity.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvestorDashboard;
