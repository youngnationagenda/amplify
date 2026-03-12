import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOKENS, TOKEN_DECIMALS, UBESWAP_POOLS, UBESWAP_ROUTER, UBESWAP_ROUTER_ABI, ERC20_ABI } from "@/config/defi";
import { ArrowDownUp, Loader2, AlertCircle } from "lucide-react";

interface SwapPanelProps {
  availableTokens?: string[];
}

type SwapPair = { tokenIn: string; tokenOut: string; pool: typeof UBESWAP_POOLS[keyof typeof UBESWAP_POOLS] };

const SWAP_ROUTES: SwapPair[] = [
  { tokenIn: "CELO", tokenOut: "NTC", pool: UBESWAP_POOLS.NTC_CELO },
  { tokenIn: "USDC", tokenOut: "NTC", pool: UBESWAP_POOLS.NTC_USDC },
  { tokenIn: "USDC", tokenOut: "NTEV", pool: UBESWAP_POOLS.NTEV_USDC },
  { tokenIn: "NTC", tokenOut: "CELO", pool: UBESWAP_POOLS.NTC_CELO },
  { tokenIn: "NTC", tokenOut: "USDC", pool: UBESWAP_POOLS.NTC_USDC },
  { tokenIn: "NTEV", tokenOut: "USDC", pool: UBESWAP_POOLS.NTEV_USDC },
];

const SwapPanel = ({ availableTokens }: SwapPanelProps) => {
  const { address, chain } = useAccount();
  const [tokenIn, setTokenIn] = useState("CELO");
  const [tokenOut, setTokenOut] = useState("NTC");
  const [amountIn, setAmountIn] = useState("");
  const [slippage] = useState(0.5); // 0.5%

  const { writeContract, isPending } = useWriteContract();

  const route = SWAP_ROUTES.find(
    (r) => r.tokenIn === tokenIn && r.tokenOut === tokenOut
  );

  const estimatedOut = route
    ? tokenIn === "CELO" && tokenOut === "NTC"
      ? Number(amountIn) * route.pool.currentPrice
      : tokenIn === "USDC" && tokenOut === "NTC"
        ? Number(amountIn) / 0.1
        : tokenIn === "USDC" && tokenOut === "NTEV"
          ? Number(amountIn) * route.pool.currentPrice
          : tokenIn === "NTC" && tokenOut === "CELO"
            ? Number(amountIn) / route.pool.currentPrice
            : tokenIn === "NTC" && tokenOut === "USDC"
              ? Number(amountIn) * 0.1
              : Number(amountIn) / route.pool.currentPrice
    : 0;

  const inTokens = availableTokens
    ? [...new Set(SWAP_ROUTES.filter((r) => availableTokens.includes(r.tokenIn)).map((r) => r.tokenIn))]
    : [...new Set(SWAP_ROUTES.map((r) => r.tokenIn))];

  const outTokens = SWAP_ROUTES.filter((r) => r.tokenIn === tokenIn).map((r) => r.tokenOut);

  const handleSwap = async () => {
    if (!address || !route || !amountIn || !chain) return;

    const decimalsIn = TOKEN_DECIMALS[tokenIn];
    const decimalsOut = TOKEN_DECIMALS[tokenOut];
    const parsedAmountIn = parseUnits(amountIn, decimalsIn);
    const minOut = parseUnits(
      (estimatedOut * (1 - slippage / 100)).toFixed(decimalsOut > 6 ? 8 : 2),
      decimalsOut
    );

    const tokenInAddress = TOKENS[tokenIn as keyof typeof TOKENS];
    const tokenOutAddress = TOKENS[tokenOut as keyof typeof TOKENS];

    // Step 1: Approve if ERC-20 (not native CELO)
    if (tokenIn !== "CELO") {
      writeContract({
        address: tokenInAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [UBESWAP_ROUTER, parsedAmountIn],
        chain,
        account: address,
      });
    }

    // Step 2: Swap via Ubeswap Router
    writeContract({
      address: UBESWAP_ROUTER,
      abi: UBESWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: tokenInAddress,
          tokenOut: tokenOutAddress,
          fee: route.pool.fee,
          recipient: address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
          amountIn: parsedAmountIn,
          amountOutMinimum: minOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
      chain,
      account: address,
      ...(tokenIn === "CELO" ? { value: parsedAmountIn } : {}),
    });
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ArrowDownUp className="w-4 h-4 text-primary" />
        <h4 className="font-display font-bold text-sm">Swap via Ubeswap</h4>
      </div>

      {/* From */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">You Pay</Label>
        <div className="flex gap-2">
          <Select value={tokenIn} onValueChange={(v) => {
            setTokenIn(v);
            const available = SWAP_ROUTES.filter((r) => r.tokenIn === v);
            if (available.length > 0 && !available.find((r) => r.tokenOut === tokenOut)) {
              setTokenOut(available[0].tokenOut);
            }
          }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {inTokens.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* To */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">You Receive (estimated)</Label>
        <div className="flex gap-2">
          <Select value={tokenOut} onValueChange={setTokenOut}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {outTokens.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={estimatedOut ? estimatedOut.toFixed(4) : ""}
            readOnly
            className="flex-1 bg-muted/30"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Info */}
      {route && amountIn && (
        <div className="text-xs space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pool</span>
            <span className="font-mono text-[10px]">{route.pool.address.slice(0, 10)}…</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee</span>
            <span>0.3%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slippage</span>
            <span>{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min. received</span>
            <span>{(estimatedOut * (1 - slippage / 100)).toFixed(4)} {tokenOut}</span>
          </div>
        </div>
      )}

      {!route && tokenIn && tokenOut && (
        <div className="flex items-center gap-2 text-xs text-destructive p-2 rounded bg-destructive/10">
          <AlertCircle className="w-3 h-3" />
          No pool available for {tokenIn} → {tokenOut}
        </div>
      )}

      <Button
        variant="glow"
        className="w-full"
        onClick={handleSwap}
        disabled={!address || !route || !amountIn || isPending}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Swapping…</>
        ) : (
          <>Swap {tokenIn} → {tokenOut}</>
        )}
      </Button>
    </div>
  );
};

export default SwapPanel;
