import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight, Shield, Heart } from "lucide-react";

const DeFiActions = () => {
  const [lendToken, setLendToken] = useState("USDC");
  const [lendAmount, setLendAmount] = useState("");
  const [borrowToken, setBorrowToken] = useState("USDC");
  const [borrowAmount, setBorrowAmount] = useState("");

  // Placeholder health factor
  const healthFactor = 2.45;
  const collateralValue = 1250;
  const borrowedValue = 510;
  const ltv = borrowedValue / collateralValue;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Health Factor */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Health Factor</span>
          </div>
          <span className={`font-display text-xl font-bold ${healthFactor > 1.5 ? "text-primary" : healthFactor > 1 ? "text-warning" : "text-destructive"}`}>
            {healthFactor.toFixed(2)}
          </span>
        </div>
        <Progress value={Math.min(ltv * 100, 100)} className="h-2 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Collateral: ${collateralValue}</span>
          <span>Borrowed: ${borrowedValue}</span>
          <span>LTV: {(ltv * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Collateral Dashboard */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-secondary" />
          <span className="text-sm font-bold">Collateral</span>
        </div>
        <div className="space-y-2 text-xs">
          {[
            { token: "NTC", amount: "5,000", value: "$500" },
            { token: "NTEV", amount: "750", value: "$750" },
          ].map((c) => (
            <div key={c.token} className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="font-medium">{c.token}</span>
              <span>{c.amount}</span>
              <span className="text-muted-foreground">{c.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lend / Borrow Tabs */}
      <Tabs defaultValue="lend">
        <TabsList className="w-full">
          <TabsTrigger value="lend" className="flex-1 gap-1">
            <ArrowUpRight className="w-3 h-3" /> Lend
          </TabsTrigger>
          <TabsTrigger value="borrow" className="flex-1 gap-1">
            <ArrowDownLeft className="w-3 h-3" /> Borrow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lend" className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Token to Lend</Label>
            <Select value={lendToken} onValueChange={setLendToken}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NTC">NTC</SelectItem>
                <SelectItem value="NTEV">NTEV</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={lendAmount}
              onChange={(e) => setLendAmount(e.target.value)}
            />
          </div>
          <div className="text-xs p-2 rounded bg-primary/10 text-primary">
            Est. APY: 11.8% • Withdrawal: Instant (subject to liquidity)
          </div>
          <Button variant="glow" className="w-full" disabled>
            <ArrowUpRight className="w-4 h-4 mr-1" /> Lend {lendToken}
            <span className="text-xs ml-1 opacity-60">(Coming Soon)</span>
          </Button>
        </TabsContent>

        <TabsContent value="borrow" className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Token to Borrow</Label>
            <Select value={borrowToken} onValueChange={setBorrowToken}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NTC">NTC</SelectItem>
                <SelectItem value="NTEV">NTEV</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
            />
          </div>
          <div className="text-xs p-2 rounded bg-warning/10 text-warning">
            Interest: 8.2–15.8% APY • Max LTV: 75% • Collateral: NTC / NTEV
          </div>
          <Button variant="outline" className="w-full" disabled>
            <ArrowDownLeft className="w-4 h-4 mr-1" /> Borrow {borrowToken}
            <span className="text-xs ml-1 opacity-60">(Coming Soon)</span>
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeFiActions;
