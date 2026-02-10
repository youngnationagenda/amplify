import { useState } from "react";
import { TrendingUp, Clock, DollarSign, Leaf, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const icuRounds = [
  {
    id: 1, name: "ICU Round 1 — Nairobi Fleet",
    pricePerTon: 60, marketPrice: 100,
    totalCredits: 500, sold: 320,
    issuanceDate: "2026-06-01",
    endDate: "2026-03-15",
    status: "active",
    description: "Pre-production carbon credits from Nairobi fleet expansion"
  },
  {
    id: 2, name: "ICU Round 2 — Mombasa Fleet",
    pricePerTon: 65, marketPrice: 100,
    totalCredits: 300, sold: 50,
    issuanceDate: "2026-09-01",
    endDate: "2026-05-30",
    status: "active",
    description: "Pre-production credits from Mombasa coastal operations"
  },
  {
    id: 3, name: "ICU Round 3 — Kisumu Expansion",
    pricePerTon: 55, marketPrice: 100,
    totalCredits: 200, sold: 0,
    issuanceDate: "2027-01-01",
    endDate: "2026-08-30",
    status: "upcoming",
    description: "Early-bird pricing for Kisumu lakeside operations"
  },
];

export function ICUOfferings() {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState("10");

  const selected = icuRounds.find(r => r.id === selectedRound);
  const totalCost = selected ? Number(purchaseAmount) * selected.pricePerTon : 0;
  const savings = selected ? (selected.marketPrice - selected.pricePerTon) * Number(purchaseAmount) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>Initial Carbon Unit (ICU) Offerings</h2>
            <p className="text-sm text-muted-foreground">Buy future carbon credits at discounted pre-production prices</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card p-5">
        <h3 className="font-bold mb-3" style={{ fontFamily: 'Space Grotesk' }}>How ICU Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Buy at Discount", desc: "Purchase carbon credits at pre-production prices ($55-$65/ton)" },
            { step: "2", title: "Credits Generated", desc: "Fleet generates verified carbon credits through IoT validation" },
            { step: "3", title: "Auto-Allocated", desc: "Credits minted on-chain and automatically allocated to your wallet" },
          ].map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-sm">{s.step}</div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ICU Rounds */}
      <div className="space-y-4">
        {icuRounds.map(round => {
          const progress = (round.sold / round.totalCredits) * 100;
          const discount = ((round.marketPrice - round.pricePerTon) / round.marketPrice * 100).toFixed(0);
          return (
            <div
              key={round.id}
              onClick={() => setSelectedRound(round.id)}
              className={`glass-card p-5 cursor-pointer transition-all hover:border-secondary/50 ${selectedRound === round.id ? 'border-secondary ring-1 ring-secondary/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>{round.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={round.status === 'active' ? 'default' : 'secondary'}>
                    {round.status === 'active' ? 'Live' : 'Upcoming'}
                  </Badge>
                  <Badge className="bg-success/20 text-success border-0">{discount}% discount</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{round.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">ICU Price</p>
                  <p className="font-bold text-success">${round.pricePerTon}/ton</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Market Price</p>
                  <p className="font-bold">${round.marketPrice}/ton</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Supply</p>
                  <p className="font-bold">{round.totalCredits} tCO₂e</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issuance Date</p>
                  <p className="font-bold">{round.issuanceDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-bold">{round.endDate}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Sold</span>
                  <span>{round.sold}/{round.totalCredits} tCO₂e ({progress.toFixed(0)}%)</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Panel */}
      {selected && selected.status === 'active' && (
        <div className="glass-card p-6 border-secondary/30">
          <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Purchase — {selected.name}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Credits (tCO₂e)</label>
                <Input
                  type="number"
                  min="1"
                  max={selected.totalCredits - selected.sold}
                  value={purchaseAmount}
                  onChange={e => setPurchaseAmount(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex justify-between text-sm">
                  <span>Total Cost</span>
                  <span className="font-bold">${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>You Save</span>
                  <span className="font-bold text-success">${savings.toLocaleString()}</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-secondary to-primary text-primary-foreground">
                <Leaf className="w-4 h-4 mr-2" />
                Purchase {purchaseAmount} ICU Credits
              </Button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-background/50 rounded-lg flex justify-between text-sm">
                <span className="text-muted-foreground">Price per ton</span>
                <span className="font-medium">${selected.pricePerTon}</span>
              </div>
              <div className="p-3 bg-background/50 rounded-lg flex justify-between text-sm">
                <span className="text-muted-foreground">Market value at issuance</span>
                <span className="font-medium text-success">${(Number(purchaseAmount) * selected.marketPrice).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-background/50 rounded-lg flex justify-between text-sm">
                <span className="text-muted-foreground">Potential ROI</span>
                <span className="font-medium text-success flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {((selected.marketPrice - selected.pricePerTon) / selected.pricePerTon * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3 bg-background/50 rounded-lg flex justify-between text-sm">
                <span className="text-muted-foreground">Expected delivery</span>
                <span className="font-medium">{selected.issuanceDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
