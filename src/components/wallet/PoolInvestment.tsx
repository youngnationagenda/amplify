import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, getAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Droplets, ExternalLink, Loader2, CheckCircle, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getContracts, TOKEN_DECIMALS, UBESWAP_ROUTER_ABI, ERC20_ABI,
  type PoolConfig, type TokenSymbol,
} from "@/config/defi";

interface PoolEntry {
  key: string;
  pool: PoolConfig;
  token0Symbol: TokenSymbol;
  token1Symbol: TokenSymbol;
}

const PoolInvestment = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { writeContract, isPending, data: writeTxHash } = useWriteContract();
  const contracts = getContracts(chain?.id);

  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [investToken, setInvestToken] = useState<TokenSymbol>("USDC");
  const [investAmount, setInvestAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activePool, setActivePool] = useState<string | null>(null);

  // Build pool list from config
  const poolEntries: PoolEntry[] = Object.entries(contracts.pools).map(([key, pool]) => ({
    key,
    pool: pool as PoolConfig,
    token0Symbol: (pool as PoolConfig).token0 as TokenSymbol,
    token1Symbol: (pool as PoolConfig).token1 as TokenSymbol,
  }));

  const selected = poolEntries.find((p) => p.key === selectedPool);

  // Get valid deposit tokens for the selected pool
  const getDepositTokens = (entry: PoolEntry): TokenSymbol[] => {
    return [entry.token0Symbol, entry.token1Symbol];
  };

  const handleInvest = async () => {
    if (!address || !chain || !selected || !investAmount || !publicClient) return;

    // Verify router
    try {
      const code = await publicClient.getCode({ address: getAddress(contracts.swapRouter) });
      if (!code || code === "0x") {
        toast({ title: "Blocked", description: "Router not a contract on this network.", variant: "destructive" });
        return;
      }
    } catch {
      toast({ title: "Error", description: "Could not verify router.", variant: "destructive" });
      return;
    }

    const decimals = TOKEN_DECIMALS[investToken];
    const parsedAmount = parseUnits(investAmount, decimals);
    const tokenAddress = contracts.tokens[investToken];

    // Determine the other token in the pair for the swap
    const tokenOut: TokenSymbol =
      investToken === selected.token0Symbol ? selected.token1Symbol : selected.token0Symbol;
    const tokenOutAddress = contracts.tokens[tokenOut];
    const decimalsOut = TOKEN_DECIMALS[tokenOut];

    setActivePool(selected.key);

    // Step 1: Approve router to spend token
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contracts.swapRouter, parsedAmount],
      chain,
      account: address,
    });

    // Step 2: Swap into the specific pool (exactInputSingle routes through that pool's fee tier)
    writeContract({
      address: contracts.swapRouter,
      abi: UBESWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [{
        tokenIn: tokenAddress,
        tokenOut: tokenOutAddress,
        fee: selected.pool.fee,
        recipient: address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
        amountIn: parsedAmount,
        amountOutMinimum: parseUnits("0", decimalsOut),
        sqrtPriceLimitX96: 0n,
      }],
      chain,
      account: address,
    });

    if (writeTxHash) {
      setTxHash(writeTxHash);
      toast({ title: "Investment Submitted", description: `Pool: ${selected.pool.token0}/${selected.pool.token1}` });
    }
  };

  if (txHash) {
    return (
      <div className="glass-card p-5 space-y-4 text-center">
        <CheckCircle className="w-10 h-10 mx-auto text-primary" />
        <h4 className="font-bold">Pool Investment Submitted</h4>
        <p className="font-mono text-[10px] text-muted-foreground break-all">{txHash}</p>
        <Button variant="outline" size="sm" asChild>
          <a href={`${contracts.blockExplorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" /> View on Explorer
          </a>
        </Button>
        <Button variant="glow" className="w-full" onClick={() => { setTxHash(null); setActivePool(null); setInvestAmount(""); }}>
          Invest Again
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Droplets className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm">Seed a Liquidity Pool</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose a pool and invest directly. Funds go to that specific Ubeswap V3 pool.
      </p>

      {/* Pool selector cards */}
      <div className="space-y-2">
        {poolEntries.map((entry) => (
          <button
            key={entry.key}
            onClick={() => {
              setSelectedPool(entry.key);
              setInvestToken(entry.token0Symbol);
            }}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedPool === entry.key
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border/50 bg-muted/10 hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm">{entry.pool.token0}/{entry.pool.token1}</span>
                <span className="text-xs text-muted-foreground ml-2">{entry.pool.fee / 10000}% fee</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">ID #{entry.pool.lpTokenId}</Badge>
                <a
                  href={`${contracts.blockExplorer}/address/${entry.pool.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
              {entry.pool.address.slice(0, 10)}…{entry.pool.address.slice(-6)}
            </p>
          </button>
        ))}
      </div>

      {/* Investment form */}
      {selected && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Pay With</Label>
            <Select value={investToken} onValueChange={(v) => setInvestToken(v as TokenSymbol)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {getDepositTokens(selected).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
            />
          </div>
          <div className="text-xs p-2 rounded bg-primary/10 text-primary flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Funds route to {selected.pool.token0}/{selected.pool.token1} pool via Ubeswap V3
          </div>
          <Button
            variant="glow"
            className="w-full"
            onClick={handleInvest}
            disabled={!address || !investAmount || isPending}
          >
            {isPending && activePool === selected.key ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Investing…</>
            ) : (
              <><Droplets className="w-4 h-4 mr-1" /> Invest {investAmount || "0"} {investToken} into Pool</>
            )}
          </Button>
        </div>
      )}

      {!address && (
        <p className="text-xs text-center text-muted-foreground">Connect wallet to invest</p>
      )}
    </div>
  );
};

export default PoolInvestment;
