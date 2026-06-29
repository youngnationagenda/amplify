import { useState, useEffect } from "react";
import {
  Coins, DollarSign, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  Bike, Leaf, Target, Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const usePortfolioData = () => {
  const [data, setData] = useState({
    totalInvested: 15000,
    currentValue: 21250,
    eotTokens: 1250,
    tokenValue: 12.50,
    motorcyclesOwned: 10,
    fractionalOwnership: 6.67,
    activeRiders: 10,
    carbonCreditsOwned: 576,
    projectedIssuance: 120,
    dailyROI: 5.00,
    weeklyROI: 35.00,
    monthlyROI: 150.00,
    yearlyROI: 1825.00,
    portfolioAllocation: { abt: 45, icu: 25, defi: 20, carbon: 10 },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        tokenValue: prev.tokenValue + (Math.random() - 0.48) * 0.1,
        currentValue: prev.currentValue + (Math.random() - 0.45) * 10,
        dailyROI: prev.dailyROI + (Math.random() - 0.48) * 0.05,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

export function PortfolioOverview() {
  const data = usePortfolioData();
  const roi = ((data.currentValue - data.totalInvested) / data.totalInvested) * 100;
  const isPositive = roi >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Stats */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Portfolio Overview</h2>
            <p className="text-muted-foreground text-sm">Real-time portfolio performance</p>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${isPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(roi).toFixed(2)}% ROI
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>Total Portfolio Value</h3>
                <p className="text-sm text-muted-foreground">Across all investment modules</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk' }}>
                ${data.currentValue.toFixed(2)}
              </div>
              <div className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{(data.currentValue - data.totalInvested).toFixed(2)} ({roi.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Wallet, label: "Total Invested", value: `$${data.totalInvested.toLocaleString()}`, color: "text-primary" },
            { icon: Bike, label: "Motorcycles", value: data.motorcyclesOwned.toString(), color: "text-secondary" },
            { icon: Leaf, label: "Carbon Credits", value: data.carbonCreditsOwned.toString(), color: "text-success" },
            { icon: Target, label: "Active Riders", value: data.activeRiders.toString(), color: "text-warning" },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Daily ROI", value: `$${data.dailyROI.toFixed(2)}` },
          { label: "Weekly ROI", value: `$${data.weeklyROI.toFixed(2)}` },
          { label: "Monthly ROI", value: `$${data.monthlyROI.toFixed(2)}` },
          { label: "Yearly ROI", value: `$${data.yearlyROI.toFixed(2)}` },
        ].map((item, i) => (
          <div key={i} className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-lg font-bold text-success" style={{ fontFamily: 'Space Grotesk' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Allocation */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>Portfolio Allocation</h3>
        <div className="space-y-3">
          {[
            { label: "Asset-Backed Tokens", value: data.portfolioAllocation.abt, color: "bg-primary" },
            { label: "ICU Holdings", value: data.portfolioAllocation.icu, color: "bg-secondary" },
            { label: "DeFi Lending", value: data.portfolioAllocation.defi, color: "bg-warning" },
            { label: "Carbon Credits", value: data.portfolioAllocation.carbon, color: "bg-success" },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-warning" />
          <h3 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[
            { action: "Carbon Credit Generated", amount: "+0.48 tCO₂e", time: "2 mins ago", type: "credit" },
            { action: "ABT Dividend Received", amount: "+$3.00", time: "1 hour ago", type: "dividend" },
            { action: "DeFi Interest Earned", amount: "+$12.50", time: "3 hours ago", type: "defi" },
            { action: "ICU Credits Delivered", amount: "+5 tCO₂e", time: "1 day ago", type: "icu" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              <span className="text-sm font-medium text-success">{item.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
