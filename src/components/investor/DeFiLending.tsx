import { useState } from "react";
import { Landmark, TrendingUp, ShieldCheck, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const pools = [
  {
    id: 1, name: "Rider Starter Loan", apy: 12.5, term: "3–12 months", risk: "Medium",
    tvl: 125000, utilization: 78, defaultRate: 2.1, description: "Individual rider micro-loans for fleet access",
    minDeposit: 50,
  },
  {
    id: 2, name: "Fleet Expansion", apy: 8.2, term: "12–36 months", risk: "Low",
    tvl: 450000, utilization: 62, defaultRate: 0.5, description: "Large fleet operator expansion financing",
    minDeposit: 500,
  },
  {
    id: 3, name: "Quick Mobility", apy: 15.8, term: "1–3 months", risk: "High",
    tvl: 35000, utilization: 91, defaultRate: 5.2, description: "Short-term liquidity for urgent rider needs",
    minDeposit: 25,
  },
];

export function DeFiLending() {
  const [selectedPool, setSelectedPool] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("500");

  const selected = pools.find(p => p.id === selectedPool);
  const dailyYield = selected ? (Number(depositAmount) * selected.apy / 100 / 365) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>DeFi Lending Pools</h2>
            <p className="text-sm text-muted-foreground">Lend stablecoins to riders and fleet operators. Earn daily yield.</p>
          </div>
        </div>
      </div>

      {/* Pool Cards */}
      <div className="space-y-4">
        {pools.map(pool => (
          <div
            key={pool.id}
            onClick={() => setSelectedPool(pool.id)}
            className={`glass-card p-5 cursor-pointer transition-all hover:border-warning/50 ${selectedPool === pool.id ? 'border-warning ring-1 ring-warning/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>{pool.name}</h3>
                <p className="text-xs text-muted-foreground">{pool.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pool.risk === 'Low' ? 'default' : pool.risk === 'Medium' ? 'secondary' : 'destructive'} className="text-xs">
                  {pool.risk === 'High' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {pool.risk === 'Low' && <ShieldCheck className="w-3 h-3 mr-1" />}
                  {pool.risk}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-3">
              <div>
                <p className="text-xs text-muted-foreground">APY</p>
                <p className="font-bold text-success text-lg">{pool.apy}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Term</p>
                <p className="font-medium">{pool.term}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">TVL</p>
                <p className="font-medium">${(pool.tvl / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utilization</p>
                <p className="font-medium">{pool.utilization}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Default Rate</p>
                <p className="font-medium">{pool.defaultRate}%</p>
              </div>
            </div>

            <Progress value={pool.utilization} className="h-2" />
          </div>
        ))}
      </div>

      {/* Deposit Panel */}
      {selected && (
        <div className="glass-card p-6 border-warning/30">
          <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Deposit into {selected.name}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Deposit Amount (USDC/cUSD)</label>
                <Input
                  type="number"
                  min={selected.minDeposit}
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground mt-1">Min: ${selected.minDeposit}</p>
              </div>
              <Button className="w-full bg-gradient-to-r from-warning to-primary text-primary-foreground">
                <DollarSign className="w-4 h-4 mr-2" />
                Deposit ${depositAmount}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">Withdraw anytime if liquidity available</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Daily Yield", value: `$${dailyYield.toFixed(4)}` },
                { label: "Monthly Yield", value: `$${(dailyYield * 30).toFixed(2)}` },
                { label: "Yearly Yield", value: `$${(dailyYield * 365).toFixed(2)}` },
                { label: "APY", value: `${selected.apy}%` },
                { label: "Historical Default", value: `${selected.defaultRate}%` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
