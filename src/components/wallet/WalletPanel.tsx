import { useAccount } from "wagmi";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectWalletButton } from "@/components/celo/ConnectWalletButton";
import TokenBalances from "./TokenBalances";
import LiquidityPositions from "./LiquidityPositions";
import SwapPanel from "./SwapPanel";
import DeFiActions from "./DeFiActions";
import PoolInvestment from "./PoolInvestment";
import TransactionHistory from "./TransactionHistory";
import { Wallet, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getContracts } from "@/config/defi";
import { useToast } from "@/hooks/use-toast";

interface WalletPanelProps {
  compact?: boolean;
}

const WalletPanel = ({ compact = false }: WalletPanelProps) => {
  const { address, isConnected, chain } = useAccount();
  const { userRole } = useAuth();
  const { toast } = useToast();
  const contracts = getContracts(chain?.id);

  const isOffsetter = userRole === "offsetter";

  // Offsetter: hide CELO and raw address
  const hideTokens = isOffsetter ? ["CELO", "NTEV"] : [];
  const availableSwapTokens = isOffsetter ? ["USDC"] : undefined;

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({ title: "Address copied" });
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        <Wallet className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Connect your wallet to view balances and trade</p>
        <ConnectWalletButton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Address Bar — hidden for offsetter */}
      {!isOffsetter && address && (
        <div className="glass-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAddress}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={`${contracts.blockExplorer}/address/${address}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Token Balances */}
      <TokenBalances hideTokens={hideTokens} />

      {/* LP Positions — not for offsetter */}
      {!isOffsetter && <LiquidityPositions />}

      {/* Swap Panel */}
      <SwapPanel availableTokens={availableSwapTokens} />

      {/* Pool Investment — not for offsetter */}
      {!isOffsetter && !compact && <PoolInvestment />}

      {/* DeFi Actions — not for offsetter */}
      {!isOffsetter && !compact && <DeFiActions />}

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
};

export default WalletPanel;
