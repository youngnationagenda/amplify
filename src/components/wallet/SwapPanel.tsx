import { useState, useEffect } from "react";
import { useAccount, useWriteContract, usePublicClient, useSendTransaction } from "wagmi";
import { parseUnits, formatUnits, getAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getContracts, TOKEN_DECIMALS, UBESWAP_ROUTER_ABI, ERC20_ABI, CELO_SEPOLIA_ID } from "@/config/defi";
import { ArrowDownUp, Loader2, AlertCircle, ShieldCheck, ShieldAlert, ExternalLink, CheckCircle, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SwapPanelProps {
  availableTokens?: string[];
}

type SwapStep = "input" | "confirm" | "success";

const SwapPanel = ({ availableTokens }: SwapPanelProps) => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const contracts = getContracts(chain?.id);
  const isTestnet = chain?.id === CELO_SEPOLIA_ID;
  const noRouter = contracts.swapRouter === "0x0000000000000000000000000000000000000000";
  const { sendTransaction, isPending: isSendPending, data: sendTxHash } = useSendTransaction();

  // Build swap routes dynamically including USDm
  const SWAP_ROUTES = [
    { tokenIn: "CELO", tokenOut: "NTC", pool: contracts.pools.NTC_CELO },
    { tokenIn: "USDC", tokenOut: "NTC", pool: contracts.pools.NTC_USDC },
    { tokenIn: "USDC", tokenOut: "NTEV", pool: contracts.pools.NTEV_USDC },
    { tokenIn: "USDm", tokenOut: "NTC", pool: contracts.pools.USDm_NTC },
    { tokenIn: "USDm", tokenOut: "NTEV", pool: contracts.pools.USDm_NTEV },
    { tokenIn: "NTC", tokenOut: "CELO", pool: contracts.pools.NTC_CELO },
    { tokenIn: "NTC", tokenOut: "USDC", pool: contracts.pools.NTC_USDC },
    { tokenIn: "NTC", tokenOut: "USDm", pool: contracts.pools.USDm_NTC },
    { tokenIn: "NTEV", tokenOut: "USDC", pool: contracts.pools.NTEV_USDC },
    { tokenIn: "NTEV", tokenOut: "USDm", pool: contracts.pools.USDm_NTEV },
  ];

  const [tokenIn, setTokenIn] = useState("CELO");
  const [tokenOut, setTokenOut] = useState("NTC");
  const [amountIn, setAmountIn] = useState("");
  const [slippage] = useState(0.5);
  const [step, setStep] = useState<SwapStep>("input");
  const [routerIsContract, setRouterIsContract] = useState<boolean | null>(null);
  const [checkingRouter, setCheckingRouter] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContract, isPending, data: writeTxHash } = useWriteContract();

  useEffect(() => {
    if (writeTxHash) {
      setTxHash(writeTxHash);
      setStep("success");
    }
  }, [writeTxHash]);

  useEffect(() => {
    if (sendTxHash) {
      setTxHash(sendTxHash);
      setStep("success");
    }
  }, [sendTxHash]);

  // Check if router address is a contract on-chain (skip for testnet with no router)
  useEffect(() => {
    if (noRouter) {
      // Testnet simulation mode — no router to check
      setRouterIsContract(null);
      setCheckingRouter(false);
      return;
    }
    const checkRouter = async () => {
      if (!publicClient) return;
      setCheckingRouter(true);
      try {
        const code = await publicClient.getCode({ address: getAddress(contracts.swapRouter) });
        setRouterIsContract(!!code && code !== "0x");
      } catch {
        setRouterIsContract(null);
      } finally {
        setCheckingRouter(false);
      }
    };
    checkRouter();
  }, [publicClient, contracts.swapRouter, noRouter]);

  const route = SWAP_ROUTES.find(
    (r) => r.tokenIn === tokenIn && r.tokenOut === tokenOut
  );

  const estimatedOut = route
    ? (() => {
        const price = route.pool.currentPrice;
        const amt = Number(amountIn);
        // Determine direction based on token position in pool
        if (tokenIn === route.pool.token0) return amt * price;
        if (tokenIn === route.pool.token1) return amt / price;
        return amt * price;
      })()
    : 0;

  const inTokens = availableTokens
    ? [...new Set(SWAP_ROUTES.filter((r) => availableTokens.includes(r.tokenIn)).map((r) => r.tokenIn))]
    : [...new Set(SWAP_ROUTES.map((r) => r.tokenIn))];

  const outTokens = SWAP_ROUTES.filter((r) => r.tokenIn === tokenIn).map((r) => r.tokenOut);

  const canSwap = address && route && amountIn && !(isPending || isSendPending) && (noRouter || routerIsContract === true);

  const networkLabel = chain?.name ?? "Unknown Network";

  const handleConfirm = () => {
    if (!noRouter && routerIsContract === false) {
      toast({
        title: "Swap Blocked",
        description: "Router address is not a contract on this network. Swap aborted to prevent loss of funds.",
        variant: "destructive",
      });
      return;
    }
    setStep("confirm");
  };

  const handleSwap = async () => {
    if (!address || !route || !amountIn || !chain) return;

    const decimalsIn = TOKEN_DECIMALS[tokenIn];
    const parsedAmountIn = parseUnits(amountIn, decimalsIn);
    const tokenInAddress = contracts.tokens[tokenIn as keyof typeof contracts.tokens];
    const tokenOutAddress = contracts.tokens[tokenOut as keyof typeof contracts.tokens];

    if (noRouter) {
      // Testnet simulation: send tokens directly to the pool address
      // This records the intent on-chain. Actual swap requires a deployed router.
      if (tokenIn === "CELO") {
        sendTransaction({
          to: route.pool.address,
          value: parsedAmountIn,
          chainId: chain.id,
        });
      } else {
        writeContract({
          address: tokenInAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [route.pool.address, parsedAmountIn],
          chain,
          account: address,
        });
        // Transfer to pool as liquidity contribution
        writeContract({
          address: tokenInAddress,
          abi: [{
            name: "transfer",
            type: "function",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          }] as const,
          functionName: "transfer",
          args: [route.pool.address, parsedAmountIn],
          chain,
          account: address,
        });
      }
      toast({
        title: "Testnet Swap Submitted",
        description: `Sent ${amountIn} ${tokenIn} to pool ${route.pool.address.slice(0, 10)}…. Deploy a SwapRouter for full swap execution.`,
      });
      return;
    }

    if (routerIsContract !== true) {
      toast({
        title: "Swap Blocked",
        description: "Destination is not a contract. Swap aborted to prevent loss of funds.",
        variant: "destructive",
      });
      setStep("input");
      return;
    }

    const decimalsOut = TOKEN_DECIMALS[tokenOut];
    const minOut = parseUnits(
      (estimatedOut * (1 - slippage / 100)).toFixed(decimalsOut > 6 ? 8 : 2),
      decimalsOut
    );

    // Step 1: Approve if ERC-20 (not native CELO)
    if (tokenIn !== "CELO") {
      writeContract({
        address: tokenInAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contracts.swapRouter, parsedAmountIn],
        chain,
        account: address,
      });
    }

    // Step 2: Swap via Ubeswap Router
    writeContract({
      address: contracts.swapRouter,
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

  const resetSwap = () => {
    setStep("input");
    setAmountIn("");
    setTxHash(null);
  };

  const RouterStatus = () => {
    if (noRouter) {
      return (
        <div className="flex items-center gap-2 text-xs p-2 rounded bg-accent/20 border border-accent/40">
          <FlaskConical className="w-3 h-3 text-accent-foreground" />
          <div>
            <span className="font-medium text-accent-foreground">Testnet Pool Mode</span>
            <span className="text-muted-foreground ml-1">— tokens sent directly to pool. Deploy SwapRouter for full swaps.</span>
          </div>
        </div>
      );
    }
    if (checkingRouter) {
      return (
        <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/30 border border-border/50">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Verifying router on {networkLabel}…</span>
        </div>
      );
    }
    if (routerIsContract === false) {
      return (
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Router is NOT a contract on {networkLabel}</p>
            <p className="text-muted-foreground">
              {contracts.swapRouter.slice(0, 10)}… is an EOA. Swaps disabled to protect your funds.
            </p>
          </div>
        </div>
      );
    }
    if (routerIsContract === true) {
      return (
        <div className="flex items-center gap-2 text-xs p-2 rounded bg-primary/10 border border-primary/30">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span className="text-primary">Router verified on {networkLabel}</span>
        </div>
      );
    }
    return null;
  };

  // Success view
  if (step === "success" && txHash) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="text-center space-y-3 py-4">
          <CheckCircle className="w-10 h-10 mx-auto text-primary" />
          <h4 className="font-display font-bold">Swap Submitted</h4>
          <p className="text-xs text-muted-foreground">
            {amountIn} {tokenIn} → ~{estimatedOut.toFixed(4)} {tokenOut}
          </p>
          <div className="font-mono text-[10px] text-muted-foreground break-all">
            {txHash}
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`${contracts.blockExplorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1" /> View on Explorer
            </a>
          </Button>
          <Button variant="glow" className="w-full" onClick={resetSwap}>
            New Swap
          </Button>
        </div>
      </div>
    );
  }

  // Confirmation view
  if (step === "confirm") {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h4 className="font-display font-bold text-sm">Confirm Swap</h4>
          </div>
          <Badge variant="outline" className="text-[10px]">{networkLabel}</Badge>
        </div>

        <div className="space-y-2 text-xs p-4 rounded-lg bg-muted/20 border border-border/50">
          <div className="flex justify-between">
            <span className="text-muted-foreground">You Pay</span>
            <span className="font-bold">{amountIn} {tokenIn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">You Receive (est.)</span>
            <span className="font-bold">{estimatedOut.toFixed(4)} {tokenOut}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min. Received</span>
            <span>{(estimatedOut * (1 - slippage / 100)).toFixed(4)} {tokenOut}</span>
          </div>
          <div className="border-t border-border/50 my-2" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">DEX</span>
            <span>Ubeswap V3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Router</span>
            <span className="font-mono text-[10px]">{contracts.swapRouter.slice(0, 10)}…{contracts.swapRouter.slice(-6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pool</span>
            <span className="font-mono text-[10px]">{route?.pool.address.slice(0, 10)}…</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee</span>
            <span>0.3%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slippage</span>
            <span>{slippage}%</span>
          </div>
        </div>

        <RouterStatus />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep("input")} disabled={isPending}>
            Back
          </Button>
          <Button
            variant="glow"
            className="flex-1"
            onClick={handleSwap}
            disabled={!canSwap}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Swapping…</>
            ) : (
              <>Confirm Swap</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Input view
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4 text-primary" />
          <h4 className="font-display font-bold text-sm">Swap via Ubeswap</h4>
        </div>
        <Badge variant="outline" className="text-[10px]">{networkLabel}</Badge>
      </div>

      <RouterStatus />

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

      {!route && tokenIn && tokenOut && (
        <div className="flex items-center gap-2 text-xs text-destructive p-2 rounded bg-destructive/10">
          <AlertCircle className="w-3 h-3" />
          No pool available for {tokenIn} → {tokenOut}
        </div>
      )}

      <Button
        variant="glow"
        className="w-full"
        onClick={handleConfirm}
        disabled={!address || !route || !amountIn || (isPending || isSendPending) || (!noRouter && routerIsContract === false)}
      >
        {!noRouter && routerIsContract === false ? (
          <><ShieldAlert className="w-4 h-4 mr-2" /> Swaps Disabled (Router Not a Contract)</>
        ) : noRouter ? (
          <><FlaskConical className="w-4 h-4 mr-2" /> Testnet Swap: {tokenIn} → {tokenOut}</>
        ) : (
          <>Review Swap: {tokenIn} → {tokenOut}</>
        )}
      </Button>
    </div>
  );
};

export default SwapPanel;
