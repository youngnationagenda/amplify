import { Shield, TrendingUp, Coins, Lock, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const EOTInvestment = () => {
  const investmentTiers = [
    {
      name: "Starter",
      tokens: 1,
      price: 1500,
      returns: "8-12%",
      features: ["1 Motorcycle Token", "Monthly Dividends", "Carbon Credit Share", "Basic Analytics"],
    },
    {
      name: "Growth",
      tokens: 5,
      price: 7500,
      returns: "12-18%",
      popular: true,
      features: ["5 Motorcycle Tokens", "Weekly Dividends", "Priority Carbon Credits", "Advanced Analytics", "Governance Rights"],
    },
    {
      name: "Enterprise",
      tokens: 20,
      price: 30000,
      returns: "18-25%",
      features: ["20 Motorcycle Tokens", "Daily Dividends", "Premium Carbon Credits", "Full Analytics Suite", "Full Governance", "Fleet Management"],
    },
  ];

  const fundingProgress = 73;
  const totalRaised = 2190000;
  const targetAmount = 3000000;

  return (
    <section id="invest" className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10" />
      <div className="hero-glow top-0 right-0 animate-pulse-glow" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <Shield className="w-4 h-4 text-secondary" />
            <span className="text-sm text-secondary font-medium">Economy of Things</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Invest in <span className="gradient-text">Asset-Backed Tokens</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Own a piece of the electric mobility revolution. Each $1,500 token represents ownership 
            in a physical electric motorcycle generating real carbon credits.
          </p>
        </div>

        {/* Funding Progress */}
        <div className="glass-card p-6 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold">Current Funding Round</h3>
                <p className="text-sm text-muted-foreground">Series A - Electric Fleet Expansion</p>
              </div>
            </div>
            <span className="text-2xl font-display font-bold text-primary">{fundingProgress}%</span>
          </div>
          <Progress value={fundingProgress} className="h-4 mb-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">${(totalRaised / 1000000).toFixed(2)}M</span> raised
            </span>
            <span className="text-muted-foreground">
              Target: <span className="text-foreground font-medium">${(targetAmount / 1000000).toFixed(0)}M</span>
            </span>
          </div>
        </div>

        {/* Investment Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {investmentTiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`glass-card p-6 relative transition-all duration-300 hover:border-primary/50 ${
                tier.popular ? 'border-primary/50 shadow-lg shadow-primary/10' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <h3 className="font-display text-xl font-bold mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-display font-bold">${tier.price.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {tier.tokens} Token{tier.tokens > 1 ? 's' : ''} • {tier.returns} APY
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={tier.popular ? "glow" : "outline"} 
                className="w-full"
              >
                Invest Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { icon: Shield, label: "Asset-Backed", value: "100%" },
            { icon: Lock, label: "Smart Contract", value: "Audited" },
            { icon: Coins, label: "Token Price", value: "$100" },
            { icon: TrendingUp, label: "Avg. Returns", value: "15.4%" },
          ].map((item, index) => (
            <div key={index} className="glass-card p-4 text-center">
              <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="font-display font-bold text-lg">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EOTInvestment;
