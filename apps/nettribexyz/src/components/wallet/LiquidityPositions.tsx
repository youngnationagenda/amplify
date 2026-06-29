import { getContracts } from "@/config/defi";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Droplets } from "lucide-react";

const LiquidityPositions = () => {
  const { chain } = useAccount();
  const contracts = getContracts(chain?.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Droplets className="w-4 h-4 text-secondary" />
        <h4 className="font-display font-bold text-sm">Liquidity Positions (LP NFTs)</h4>
      </div>
      {contracts.lpPositions.map((lp) => (
        <div
          key={lp.tokenId}
          className="glass-card p-4 hover:border-secondary/40 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-secondary/50 text-secondary text-xs">
                #{lp.tokenId}
              </Badge>
              <span className="font-bold text-sm">{lp.pair}</span>
            </div>
            <Badge variant="secondary" className="text-xs">{lp.fee}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <p className="text-muted-foreground">Current Price</p>
              <p className="font-medium">
                {lp.currentPrice} {lp.token0Symbol}/{lp.token1Symbol}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Pool</p>
              <p className="font-mono text-[10px] truncate">{lp.poolAddress}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 gap-1"
            asChild
          >
            <a href={lp.explorerUrl} target="_blank" rel="noopener noreferrer">
              View on Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
};

export default LiquidityPositions;
