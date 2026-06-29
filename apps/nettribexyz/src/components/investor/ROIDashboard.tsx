import { useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Bike, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockDailyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  earnings: 2.5 + Math.random() * 2,
  credits: 0.3 + Math.random() * 0.5,
}));

export function ROIDashboard() {
  const [projectionAmount, setProjectionAmount] = useState("1500");
  const [projectionBikes, setProjectionBikes] = useState("1");

  const motorcyclesOwned = 10;
  const fractionalEquivalent = 3.33;
  const dailyPerBike = 3;
  const dailyEarnings = fractionalEquivalent * dailyPerBike;

  const projectedDaily = (Number(projectionAmount) / 1500) * dailyPerBike;
  const projectedMonthly = projectedDaily * 30;
  const projectedYearly = projectedDaily * 365;
  const projectedAPY = ((projectedYearly / Number(projectionAmount)) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>ROI Dashboard</h2>
            <p className="text-sm text-muted-foreground">Track earnings across all time periods</p>
          </div>
        </div>

        <Tabs defaultValue="daily">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Today's Earnings" value={`$${dailyEarnings.toFixed(2)}`} icon={DollarSign} />
              <StatCard label="Yesterday" value={`$${(dailyEarnings - 0.2).toFixed(2)}`} icon={DollarSign} />
              <StatCard label="Daily Credits" value="0.48 tCO₂e" icon={TrendingUp} />
            </div>
            <EarningsChart data={mockDailyData.slice(-7)} label="day" />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="This Week" value={`$${(dailyEarnings * 7).toFixed(2)}`} icon={DollarSign} />
              <StatCard label="Weekly APY" value={`${((dailyEarnings * 365 / 15000) * 100).toFixed(1)}%`} icon={TrendingUp} />
              <StatCard label="Weekly Credits" value="3.36 tCO₂e" icon={TrendingUp} />
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="This Month" value={`$${(dailyEarnings * 30).toFixed(2)}`} icon={DollarSign} />
              <StatCard label="Carbon Credits" value="14.4 tCO₂e" icon={TrendingUp} />
              <StatCard label="Depreciation" value="-$25.00" icon={DollarSign} negative />
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Annualized" value={`$${(dailyEarnings * 365).toFixed(2)}`} icon={DollarSign} />
              <StatCard label="APY" value={`${((dailyEarnings * 365 / 15000) * 100).toFixed(1)}%`} icon={TrendingUp} />
              <StatCard label="Total Credits" value="175 tCO₂e" icon={TrendingUp} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ownership Breakdown */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bike className="w-5 h-5 text-secondary" />
          <h3 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>Ownership Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Motorcycles Financed</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{motorcyclesOwned}</p>
          </div>
          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Equivalent Full Bikes</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{fractionalEquivalent}</p>
          </div>
          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Daily Revenue</p>
            <p className="text-2xl font-bold text-success" style={{ fontFamily: 'Space Grotesk' }}>${dailyEarnings.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Daily Per Bike</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>${dailyPerBike}</p>
          </div>
        </div>
      </div>

      {/* Projections Calculator */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-warning" />
          <h3 className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>Investment Projections</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Investment Amount ($)</label>
              <Input type="number" value={projectionAmount} onChange={e => setProjectionAmount(e.target.value)} className="bg-background/50" />
            </div>
            <p className="text-xs text-muted-foreground">= {(Number(projectionAmount) / 1500).toFixed(2)} equivalent motorcycles</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
              <p className="text-xs text-muted-foreground">Daily</p>
              <p className="font-bold text-success">${projectedDaily.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
              <p className="text-xs text-muted-foreground">Monthly</p>
              <p className="font-bold text-success">${projectedMonthly.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
              <p className="text-xs text-muted-foreground">Yearly</p>
              <p className="font-bold text-success">${projectedYearly.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">APY</p>
              <p className="font-bold text-primary">{projectedAPY.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, negative }: { label: string; value: string; icon: any; negative?: boolean }) {
  return (
    <div className="p-4 bg-background/50 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${negative ? 'text-destructive' : 'text-primary'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold ${negative ? 'text-destructive' : ''}`} style={{ fontFamily: 'Space Grotesk' }}>{value}</p>
    </div>
  );
}

function EarningsChart({ data, label }: { data: any[]; label: string }) {
  const max = Math.max(...data.map(d => d.earnings));
  return (
    <div className="glass-card p-4">
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">${d.earnings.toFixed(1)}</span>
            <div
              className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-md transition-all hover:opacity-80"
              style={{ height: `${(d.earnings / max) * 100}%` }}
            />
            <span className="text-[10px] text-muted-foreground">{d[label]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
