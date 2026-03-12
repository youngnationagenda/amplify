import { useAccount, useBalance, useReadContract } from "wagmi";
import { TOKENS, TOKEN_LABELS, ERC20_ABI } from "@/config/defi";
import { formatUnits } from "viem";
import { Coins, DollarSign } from "lucide-react";

interface TokenBalancesProps {
  hideTokens?: string[];
}

const TokenBalances = ({ hideTokens = [] }: TokenBalancesProps) => {
  const { address } = useAccount();

  const { data: celoBalance } = useBalance({ address });

  const { data: ntcRaw } = useReadContract({
    address: TOKENS.NTC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: usdcRaw } = useReadContract({
    address: TOKENS.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: ntevRaw } = useReadContract({
    address: TOKENS.NTEV,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const balances = [
    {
      symbol: "CELO",
      label: TOKEN_LABELS.CELO,
      balance: celoBalance ? Number(formatUnits(celoBalance.value, 18)).toFixed(4) : "0.0000",
      usdValue: celoBalance ? (Number(formatUnits(celoBalance.value, 18)) * 0.5).toFixed(2) : "0.00",
      icon: <span className="text-lg font-bold text-[hsl(var(--celo-gold))]">C</span>,
      color: "from-[hsl(var(--celo-green))] to-[hsl(var(--celo-gold))]",
    },
    {
      symbol: "USDC",
      label: TOKEN_LABELS.USDC,
      balance: usdcRaw ? Number(formatUnits(usdcRaw as bigint, 6)).toFixed(2) : "0.00",
      usdValue: usdcRaw ? Number(formatUnits(usdcRaw as bigint, 6)).toFixed(2) : "0.00",
      icon: <DollarSign className="w-5 h-5 text-[hsl(var(--cusd-blue))]" />,
      color: "from-[hsl(var(--cusd-blue))] to-[hsl(var(--cusd-blue))]",
    },
    {
      symbol: "NTC",
      label: TOKEN_LABELS.NTC,
      balance: ntcRaw ? Number(formatUnits(ntcRaw as bigint, 18)).toFixed(4) : "0.0000",
      usdValue: ntcRaw ? (Number(formatUnits(ntcRaw as bigint, 18)) * 0.1).toFixed(2) : "0.00",
      icon: <Coins className="w-5 h-5 text-primary" />,
      color: "from-primary to-secondary",
    },
    {
      symbol: "NTEV",
      label: TOKEN_LABELS.NTEV,
      balance: ntevRaw ? Number(formatUnits(ntevRaw as bigint, 18)).toFixed(4) : "0.0000",
      usdValue: ntevRaw ? (Number(formatUnits(ntevRaw as bigint, 18)) * 1.0).toFixed(2) : "0.00",
      icon: <span className="text-lg font-bold text-secondary">E</span>,
      color: "from-secondary to-primary",
    },
  ].filter((t) => !hideTokens.includes(t.symbol));

  return (
    <div className="grid grid-cols-2 gap-3">
      {balances.map((token) => (
        <div
          key={token.symbol}
          className="glass-card p-4 hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center`}>
              {token.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{token.label}</p>
              <p className="font-bold text-sm">{token.symbol}</p>
            </div>
          </div>
          <p className="font-display text-lg font-bold">{token.balance}</p>
          <p className="text-xs text-muted-foreground">≈ ${token.usdValue}</p>
        </div>
      ))}
    </div>
  );
};

export default TokenBalances;
