import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { Store, TrendingUp, Leaf, ArrowUpRight, ArrowDownRight, ShoppingCart, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TOKEN_LABELS, TOKEN_DECIMALS, ERC20_ABI, UBESWAP_ROUTER_ABI, getContracts, TREASURY_ADDRESS } from "@/config/defi";
import { ConnectWalletButton } from "@/components/celo/ConnectWalletButton";
import { useToast } from "@/hooks/use-toast";

const priceHistory = [85, 88, 92, 87, 95, 98, 100, 96, 102, 105, 100, 108];
const holdings = [
  { source: "ICU Round 1", amount: 25, avgCost: 60, currentPrice: 100 },
  { source: "Spot Purchase", amount: 10, avgCost: 95, currentPrice: 100 },
  { source: "Fleet Generated", amount: 14.4, avgCost: 0, currentPrice: 100 },
];

type PayToken = "USDC" | "USDm" | "CELO" | "NTC";

export function CarbonMarketplace() {
  const [buyAmount, setBuyAmount] = useState("5");
  const [sellAmount, setSellAmount] = useState("5");
  const [buyToken, setBuyToken] = useState<PayToken>("USDC");
  const [sellToken, setSellToken] = useState<PayToken>("USDC");
  const currentPrice = 100;
  const priceChange = ((currentPrice - priceHistory[priceHistory.length - 2]) / priceHistory[priceHistory.length - 2] * 100);
  const isUp = priceChange >= 0;

  const totalHoldings = holdings.reduce((a, b) => a + b.amount, 0);
  const totalValue = totalHoldings * currentPrice;

  const tokenPrices: Record<PayToken, number> = { USDC: 1, USDm: 1, CELO: 0.5, NTC: 0.1 };
  const buyTokenAmount = (Number(buyAmount) * currentPrice) / tokenPrices[buyToken];
  const sellTokenAmount = (Number(sellAmount) * currentPrice) / tokenPrices[sellToken];

  const TokenSelector = ({ value, onChange }: { value: PayToken; onChange: (v: PayToken) => void }) => (
    <Select value={value} onValueChange={(v) => onChange(v as PayToken)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(["USDC", "USDm", "CELO", "NTC"] as PayToken[]).map((t) => (
          <SelectItem key={t} value={t}>{t} — {TOKEN_LABELS[t]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ fontFamily: 'Space Grotesk' }}>Carbon Credit Marketplace</h2>
            <p className="text-sm text-muted-foreground">Buy, sell, and track carbon credits</p>
          </div>
        </div>
      </div>

      {/* Price & Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Market Price</p>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>${currentPrice}/ton</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isUp ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
              {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(priceChange).toFixed(1)}%
            </div>
          </div>
          <div className="flex items-end gap-1 h-20">
            {priceHistory.map((p, i) => {
              const max = Math.max(...priceHistory);
              const min = Math.min(...priceHistory);
              const height = ((p - min) / (max - min)) * 100 || 10;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm ${i === priceHistory.length - 1 ? 'bg-primary' : 'bg-primary/40'}`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">12-month price history</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Your Carbon Portfolio</p>
          <p className="text-3xl font-bold gradient-text mb-1" style={{ fontFamily: 'Space Grotesk' }}>{totalHoldings.toFixed(1)} tCO₂e</p>
          <p className="text-sm text-muted-foreground mb-4">Value: ${totalValue.toLocaleString()}</p>
          <div className="space-y-2">
            {holdings.map((h, i) => (
              <div key={i} className="flex justify-between text-sm p-2 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">{h.source}</span>
                <span className="font-medium">{h.amount} tCO₂e</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buy / Sell */}
      <div className="glass-card p-6">
        <Tabs defaultValue="buy">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="buy">Buy Credits</TabsTrigger>
            <TabsTrigger value="sell">Sell Credits</TabsTrigger>
          </TabsList>
          <TabsContent value="buy">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Amount (tCO₂e)</label>
                  <Input type="number" min="1" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} className="bg-background/50" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Pay With</label>
                  <TokenSelector value={buyToken} onChange={setBuyToken} />
                </div>
                <div className="p-3 bg-background/50 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-bold">${(Number(buyAmount) * currentPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">You Pay</span>
                    <span className="font-medium">{buyTokenAmount.toFixed(2)} {buyToken}</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-success to-primary text-primary-foreground">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy {buyAmount} Credits with {buyToken}
                </Button>
              </div>
              <div className="p-4 bg-success/5 rounded-xl border border-success/20">
                <p className="text-sm font-medium mb-2">Why buy carbon credits?</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Offset your company's carbon footprint</li>
                  <li>• Trade on secondary markets for profit</li>
                  <li>• Meet ESG compliance requirements</li>
                  <li>• Support sustainable mobility in Africa</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sell">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Amount to sell (tCO₂e)</label>
                  <Input type="number" min="1" max={totalHoldings} value={sellAmount} onChange={e => setSellAmount(e.target.value)} className="bg-background/50" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Receive As</label>
                  <TokenSelector value={sellToken} onChange={setSellToken} />
                </div>
                <div className="p-3 bg-background/50 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">You Receive</span>
                    <span className="font-bold text-success">{sellTokenAmount.toFixed(2)} {sellToken}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">USD Value</span>
                    <span>${(Number(sellAmount) * currentPrice).toLocaleString()}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-success text-success hover:bg-success/10">
                  Sell {sellAmount} Credits → {sellToken}
                </Button>
              </div>
              <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                <p className="text-sm font-medium mb-2">Available to sell</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{totalHoldings.toFixed(1)} tCO₂e</p>
                <p className="text-xs text-muted-foreground mt-1">Pending issuance not included</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
