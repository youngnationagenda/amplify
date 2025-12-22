import { Wallet, ArrowUpRight, ArrowDownLeft, Percent, Shield, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DeFiSection = () => {
  const lendingPools = [
    {
      name: "Rider Starter Loan",
      apy: 12.5,
      available: 450000,
      total: 500000,
      minLoan: 500,
      maxLoan: 5000,
      term: "3-12 months",
    },
    {
      name: "Fleet Expansion",
      apy: 8.2,
      available: 1200000,
      total: 2000000,
      minLoan: 10000,
      maxLoan: 100000,
      term: "12-36 months",
    },
    {
      name: "Quick Mobility",
      apy: 15.8,
      available: 180000,
      total: 200000,
      minLoan: 100,
      maxLoan: 1000,
      term: "1-3 months",
    },
  ];

  const stats = [
    { label: "Total Value Locked", value: "$4.2M", icon: Wallet },
    { label: "Active Loans", value: "347", icon: Users },
    { label: "Avg. APY", value: "11.8%", icon: Percent },
    { label: "Default Rate", value: "0.8%", icon: Shield },
  ];

  return (
    <section id="defi" className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Decentralized Finance</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            DeFi <span className="gradient-text">Lending & Financing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access instant financing for electric motorcycles or earn yield by providing liquidity 
            to the mobility ecosystem.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-card p-5 text-center group hover:border-primary/50 transition-all"
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-display text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Borrow Card */}
          <div className="glass-card p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <ArrowDownLeft className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Borrow</h3>
                <p className="text-sm text-muted-foreground">Get instant financing for your e-motorcycle</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Collateral Required</span>
                <span className="font-medium">Carbon Credits / EOT Tokens</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Interest Rates</span>
                <span className="font-medium text-primary">8.2% - 15.8% APY</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max LTV</span>
                <span className="font-medium">75%</span>
              </div>
            </div>
            <Button variant="glow" className="w-full">
              Apply for Loan
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Lend Card */}
          <div className="glass-card p-6 border-secondary/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-secondary/10">
                <ArrowUpRight className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Lend</h3>
                <p className="text-sm text-muted-foreground">Earn yield by providing liquidity</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Accepted Assets</span>
                <span className="font-medium">USDC, USDT, DAI</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg. Yield</span>
                <span className="font-medium text-secondary">11.8% APY</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Withdrawal</span>
                <span className="font-medium">Instant (subject to liquidity)</span>
              </div>
            </div>
            <Button variant="outline" className="w-full border-secondary/50 hover:bg-secondary/10">
              Start Lending
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lending Pools */}
        <h3 className="font-display text-xl font-bold mb-6">Available Lending Pools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lendingPools.map((pool, index) => (
            <div
              key={index}
              className="glass-card p-6 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-bold">{pool.name}</h4>
                <span className="text-lg font-bold text-primary">{pool.apy}%</span>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Pool Utilization</span>
                  <span>{((1 - pool.available / pool.total) * 100).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={(1 - pool.available / pool.total) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Available
                  </span>
                  <span>${(pool.available / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Term
                  </span>
                  <span>{pool.term}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DeFiSection;
