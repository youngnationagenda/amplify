import { useState } from "react";
import { Coins, Bike, User, TrendingUp, ShieldCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const motorcycles = [
  { id: 1, model: "E-Rider Pro X", rider: "James K.", dailyRevenue: 3, carbonYield: 35, riskScore: "Low", funded: 75, price: 1500 },
  { id: 2, model: "E-Rider Pro X", rider: "Mary W.", dailyRevenue: 3, carbonYield: 42, riskScore: "Low", funded: 100, price: 1500 },
  { id: 3, model: "E-Rider Lite", rider: "Daniel O.", dailyRevenue: 2.5, carbonYield: 28, riskScore: "Medium", funded: 40, price: 1500 },
  { id: 4, model: "E-Rider Pro X", rider: "Sarah N.", dailyRevenue: 3, carbonYield: 38, riskScore: "Low", funded: 60, price: 1500 },
  { id: 5, model: "E-Rider Cargo", rider: "Peter M.", dailyRevenue: 3.5, carbonYield: 50, riskScore: "Low", funded: 20, price: 1500 },
  { id: 6, model: "E-Rider Lite", rider: "Grace A.", dailyRevenue: 2.5, carbonYield: 25, riskScore: "Medium", funded: 0, price: 1500 },
];

export function AssetBackedTokens() {
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
  const [investAmount, setInvestAmount] = useState("100");

  const selected = motorcycles.find(m => m.id === selectedBike);
  const ownership = selected ? (Number(investAmount) / selected.price * 100) : 0;
  const dailyReturn = selected ? (Number(investAmount) / selected.price * selected.dailyRevenue) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>Asset-Backed Tokens</h2>
            <p className="text-sm text-muted-foreground">Each motorcycle = $1,500 tokenized asset. Min buy-in: $100</p>
          </div>
        </div>
      </div>

      {/* Token Info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Token Price</p>
          <p className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>$1,500</p>
          <p className="text-[10px] text-muted-foreground">per motorcycle</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Min Investment</p>
          <p className="text-xl font-bold text-primary" style={{ fontFamily: 'Space Grotesk' }}>$100</p>
          <p className="text-[10px] text-muted-foreground">fractional ownership</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Daily Revenue</p>
          <p className="text-xl font-bold text-success" style={{ fontFamily: 'Space Grotesk' }}>$3/bike</p>
          <p className="text-[10px] text-muted-foreground">rider-generated</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Estimated APY</p>
          <p className="text-xl font-bold text-warning" style={{ fontFamily: 'Space Grotesk' }}>~73%</p>
          <p className="text-[10px] text-muted-foreground">($3/day × 365)</p>
        </div>
      </div>

      {/* Motorcycle Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {motorcycles.map(bike => (
          <div
            key={bike.id}
            onClick={() => setSelectedBike(bike.id)}
            className={`glass-card p-5 cursor-pointer transition-all hover:border-primary/50 ${selectedBike === bike.id ? 'border-primary ring-1 ring-primary/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-secondary" />
                <span className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>{bike.model}</span>
              </div>
              <Badge variant={bike.riskScore === "Low" ? "default" : "secondary"} className="text-[10px]">
                {bike.riskScore} Risk
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Rider</p>
                <div className="flex items-center gap-1"><User className="w-3 h-3" /> {bike.rider}</div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Daily Rev</p>
                <p className="text-success font-medium">${bike.dailyRevenue}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Carbon/yr</p>
                <p className="font-medium">{bike.carbonYield} tCO₂e</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Funding Progress</span>
                <span>{bike.funded}%</span>
              </div>
              <Progress value={bike.funded} className="h-2" />
            </div>

            {bike.funded >= 100 && (
              <p className="text-xs text-muted-foreground mt-2 italic">Fully funded — secondary market only</p>
            )}
          </div>
        ))}
      </div>

      {/* Investment Panel */}
      {selected && selected.funded < 100 && (
        <div className="glass-card p-6 border-primary/30">
          <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Invest in {selected.model} — {selected.rider}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Amount (USD)</label>
                <Input
                  type="number"
                  min="100"
                  max={selected.price * (1 - selected.funded / 100)}
                  value={investAmount}
                  onChange={e => setInvestAmount(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ownership: {ownership.toFixed(2)}% • Daily return: ${dailyReturn.toFixed(2)}
              </p>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                <Coins className="w-4 h-4 mr-2" />
                Invest ${investAmount} via Celo
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">Pay with USDC, cUSD, or CELO</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Your Ownership", value: `${ownership.toFixed(2)}%` },
                { label: "Daily Revenue Share", value: `$${dailyReturn.toFixed(2)}` },
                { label: "Monthly Revenue", value: `$${(dailyReturn * 30).toFixed(2)}` },
                { label: "Yearly Revenue", value: `$${(dailyReturn * 365).toFixed(2)}` },
                { label: "Carbon Credit Share", value: `${(ownership / 100 * selected.carbonYield).toFixed(1)} tCO₂e/yr` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-success">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
