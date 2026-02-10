import { ShieldCheck, BarChart3, Vote, TrendingUp, Bike, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const proposals = [
  { id: 1, title: "Expand Fleet to Mombasa", status: "active", votesFor: 72, votesAgainst: 28, endsIn: "3 days" },
  { id: 2, title: "Adjust Carbon Credit Pricing to $110/ton", status: "active", votesFor: 55, votesAgainst: 45, endsIn: "5 days" },
  { id: 3, title: "Launch Kisumu Market Operations", status: "passed", votesFor: 89, votesAgainst: 11, endsIn: "Ended" },
];

const analytics = [
  { model: "E-Rider Pro X", yield: 38, utilization: 92, repayment: 97 },
  { model: "E-Rider Lite", yield: 25, utilization: 78, repayment: 85 },
  { model: "E-Rider Cargo", yield: 50, utilization: 95, repayment: 100 },
];

export function GovernanceAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Governance */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Vote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>Governance</h2>
            <p className="text-sm text-muted-foreground">Vote on fleet expansion, pricing, and new markets</p>
          </div>
        </div>

        <div className="space-y-4">
          {proposals.map(p => (
            <div key={p.id} className="p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>{p.title}</p>
                <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status === 'active' ? 'Active' : 'Passed'}</Badge>
              </div>
              <div className="flex gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-success">For: {p.votesFor}%</span>
                    <span className="text-destructive">Against: {p.votesAgainst}%</span>
                  </div>
                  <div className="h-2 bg-destructive/30 rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: `${p.votesFor}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{p.endsIn}</span>
              </div>
              {p.status === 'active' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-success/20 text-success hover:bg-success/30 text-xs">Vote For</Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs">Vote Against</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Suite */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>Fleet Analytics</h2>
            <p className="text-sm text-muted-foreground">Performance metrics by motorcycle model</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 text-muted-foreground font-medium">Model</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Carbon Yield (tCO₂e/yr)</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Utilization</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Repayment Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((a, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-3 font-medium flex items-center gap-2">
                    <Bike className="w-4 h-4 text-secondary" /> {a.model}
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-1"><Leaf className="w-3 h-3 text-primary" /> {a.yield}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={a.utilization} className="h-2 w-20" />
                      <span>{a.utilization}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={a.repayment >= 95 ? 'text-success' : a.repayment >= 80 ? 'text-warning' : 'text-destructive'}>
                      {a.repayment}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
