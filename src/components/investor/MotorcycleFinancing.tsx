import { Bike, User, Star, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const riders = [
  { id: 1, name: "James K.", score: 92, model: "E-Rider Pro X", repaymentHistory: 98, dailyRepay: 3, funded: 75, totalNeeded: 1500, estimatedAPY: 18 },
  { id: 2, name: "Daniel O.", score: 78, model: "E-Rider Lite", repaymentHistory: 85, dailyRepay: 2.5, funded: 40, totalNeeded: 1500, estimatedAPY: 15 },
  { id: 3, name: "Peter M.", score: 95, model: "E-Rider Cargo", repaymentHistory: 100, dailyRepay: 3.5, funded: 20, totalNeeded: 1500, estimatedAPY: 22 },
  { id: 4, name: "Grace A.", score: 70, model: "E-Rider Lite", repaymentHistory: 72, dailyRepay: 2.5, funded: 0, totalNeeded: 1500, estimatedAPY: 25 },
];

export function MotorcycleFinancing() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Bike className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>Motorcycle Financing Portal</h2>
            <p className="text-sm text-muted-foreground">Browse verified riders and finance electric motorcycles. $3/day repayment, 8-25% APY.</p>
          </div>
        </div>
      </div>

      {/* Syndication explainer */}
      <div className="glass-card p-5">
        <h3 className="font-bold mb-3" style={{ fontFamily: 'Space Grotesk' }}>Syndicated Investment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-muted-foreground mb-1">Invest $100</p>
            <p className="font-bold">Own 6.67% of motorcycle</p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-muted-foreground mb-1">Daily revenue share</p>
            <p className="font-bold text-success">$0.20/day (6.67% × $3)</p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-muted-foreground mb-1">Carbon credit share</p>
            <p className="font-bold text-primary">6.67% of credits</p>
          </div>
        </div>
      </div>

      {/* Rider Listings */}
      <div className="space-y-4">
        {riders.map(rider => (
          <div key={rider.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>{rider.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-warning" />
                    Score: {rider.score}/100
                    <span className="mx-1">•</span>
                    <Badge variant="outline" className="text-[10px] h-4">{rider.model}</Badge>
                  </div>
                </div>
              </div>
              <Badge variant={rider.score >= 85 ? "default" : rider.score >= 75 ? "secondary" : "destructive"} className="text-xs">
                {rider.score >= 85 ? "Verified ✓" : rider.score >= 75 ? "Good" : "New Rider"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="font-bold">${rider.totalNeeded.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Repayment</p>
                <p className="font-bold text-success">${rider.dailyRepay}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Repayment History</p>
                <p className="font-bold">{rider.repaymentHistory}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. APY</p>
                <p className="font-bold text-warning">{rider.estimatedAPY}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Funded</p>
                <p className="font-bold">{rider.funded}%</p>
              </div>
            </div>

            <Progress value={rider.funded} className="h-2 mb-3" />

            {rider.funded < 100 && (
              <div className="flex gap-2">
                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  <DollarSign className="w-3 h-3 mr-1" /> Full Token ($1,500)
                </Button>
                <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                  Fractional ($100+)
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
