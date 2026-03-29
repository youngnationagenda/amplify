import { useState, useEffect } from "react";
import { useAccount, useWriteContract, usePublicClient, useReadContract } from "wagmi";
import { parseUnits, formatUnits, getAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft, ArrowUpRight, Shield, Heart, Flame,
  Loader2, CheckCircle, ExternalLink, ShieldCheck, ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getContracts, TOKEN_DECIMALS, UBESWAP_ROUTER_ABI, ERC20_ABI, TREASURY_ADDRESS
} from "@/config/defi";

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD" as `0x${string}`;

const DeFiActions = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const contracts = getContracts(chain?.id);

  const [lendToken, setLendToken] = useState("USDC");
  const [lendAmount, setLendAmount] = useState("");
  const [borrowToken, setBorrowToken] = useState("NTC");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [routerVerified, setRouterVerified] = useState<boolean | null>(null);

  const { writeContract, isPending, data: writeTxHash } = useWriteContract();

  // Read NTC balance for burn
  const { data: ntcBalanceRaw } = useReadContract({
    address: contracts.tokens.NTC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const ntcBalance = ntcBalanceRaw ? Number(formatUnits(ntcBalanceRaw as bigint, 18)) : 0;

  // Verify router is a contract
  useEffect(() => {
    const check = async () => {
      if (!publicClient) return;
      try {
        const code = await publicClient.getCode({ address: getAddress(contracts.swapRouter) });
        setRouterVerified(!!code && code !== "0x");
      } catch {
        setRouterVerified(null);
      }
    };
    check();
  }, [publicClient, contracts.swapRouter]);

  useEffect(() => {
    if (writeTxHash) {
      setTxHash(writeTxHash);
      toast({
        title: `${activeAction} Submitted`,
        description: `Tx: ${writeTxHash.slice(0, 14)}…`,
      });
    }
  }, [writeTxHash]);

  // Collateral data (from token balances — simplified)
  const { data: ntevBalRaw } = useReadContract({
    address: contracts.tokens.NTEV,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const ntevBalance = ntevBalRaw ? Number(formatUnits(ntevBalRaw as bigint, 18)) : 0;

  const collateralValue = ntcBalance * 0.1 + ntevBalance * 1.0;
  const borrowedValue = 0; // Track from protocol later
  const healthFactor = collateralValue > 0 ? Math.max((collateralValue / Math.max(borrowedValue, 1)) * 1.5, 0) : 0;
  const ltv = collateralValue > 0 ? borrowedValue / collateralValue : 0;

  const networkLabel = chain?.name ?? "Unknown";

  // ── LEND: Deposit token into pool via swap to pool token ──
  const handleLend = async () => {
    if (!address || !lendAmount || !chain) return;
    if (routerVerified !== true) {
      toast({ title: "Blocked", description: "Router not verified on this network.", variant: "destructive" });
      return;
    }
    setActiveAction("Lend");

    const decimals = TOKEN_DECIMALS[lendToken];
    const parsedAmount = parseUnits(lendAmount, decimals);
    const tokenAddress = contracts.tokens[lendToken as keyof typeof contracts.tokens];

    // Approve router
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contracts.swapRouter, parsedAmount],
      chain,
      account: address,
    });

    // Swap to pool (lend = provide liquidity via swap to treasury)
    const poolMap: Record<string, { tokenOut: string; fee: number }> = {
      USDC: { tokenOut: "NTC", fee: 3000 },
      NTC: { tokenOut: "USDC", fee: 3000 },
      NTEV: { tokenOut: "USDC", fee: 3000 },
      USDm: { tokenOut: "NTC", fee: 3000 },
    };
    const route = poolMap[lendToken];
    if (!route) return;

    const tokenOutAddress = contracts.tokens[route.tokenOut as keyof typeof contracts.tokens];
    const decimalsOut = TOKEN_DECIMALS[route.tokenOut];
    const minOut = parseUnits("0", decimalsOut);

    writeContract({
      address: contracts.swapRouter,
      abi: UBESWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [{
        tokenIn: tokenAddress,
        tokenOut: tokenOutAddress,
        fee: route.fee,
        recipient: TREASURY_ADDRESS,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
        amountIn: parsedAmount,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0n,
      }],
      chain,
      account: address,
    });
  };

  // ── BORROW: Swap from pool to user ──
  const handleBorrow = async () => {
    if (!address || !borrowAmount || !chain) return;
    if (routerVerified !== true) {
      toast({ title: "Blocked", description: "Router not verified.", variant: "destructive" });
      return;
    }
    setActiveAction("Borrow");

    // Borrow NTC: user provides USDC collateral via swap
    // For now: swap USDC → borrowToken
    const collateralToken = borrowToken === "USDC" ? "NTC" : "USDC";
    const collateralAddress = contracts.tokens[collateralToken as keyof typeof contracts.tokens];
    const decimalsIn = TOKEN_DECIMALS[collateralToken];
    const parsedAmount = parseUnits(borrowAmount, decimalsIn);

    // Approve
    writeContract({
      address: collateralAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contracts.swapRouter, parsedAmount],
      chain,
      account: address,
    });

    const tokenOutAddress = contracts.tokens[borrowToken as keyof typeof contracts.tokens];
    const decimalsOut = TOKEN_DECIMALS[borrowToken];

    writeContract({
      address: contracts.swapRouter,
      abi: UBESWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [{
        tokenIn: collateralAddress,
        tokenOut: tokenOutAddress,
        fee: 3000,
        recipient: address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
        amountIn: parsedAmount,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      }],
      chain,
      account: address,
    });
  };

  // ── BURN NTC: Send to dead address ──
  const handleBurn = async () => {
    if (!address || !burnAmount || !chain) return;
    setActiveAction("Burn NTC");

    const parsedAmount = parseUnits(burnAmount, 18);

    if (Number(burnAmount) > ntcBalance) {
      toast({ title: "Insufficient NTC", description: `You have ${ntcBalance.toFixed(4)} NTC.`, variant: "destructive" });
      return;
    }

    writeContract({
      address: contracts.tokens.NTC,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [BURN_ADDRESS, parsedAmount],
      chain,
      account: address,
    });

    // Transfer NTC to burn address
    writeContract({
      address: contracts.tokens.NTC,
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
      args: [BURN_ADDRESS, parsedAmount],
      chain,
      account: address,
    });
  };

  const resetAction = () => {
    setActiveAction(null);
    setTxHash(null);
    setLendAmount("");
    setBorrowAmount("");
    setBurnAmount("");
  };

  // Success state
  if (txHash) {
    return (
      <div className="glass-card p-5 space-y-4 text-center">
        <CheckCircle className="w-10 h-10 mx-auto text-primary" />
        <h4 className="font-display font-bold">{activeAction} Submitted</h4>
        <p className="font-mono text-[10px] text-muted-foreground break-all">{txHash}</p>
        <Button variant="outline" size="sm" asChild>
          <a href={`${contracts.blockExplorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" /> View on Explorer
          </a>
        </Button>
        <Button variant="glow" className="w-full" onClick={resetAction}>New Action</Button>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Router Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {routerVerified === true ? (
            <ShieldCheck className="w-3 h-3 text-primary" />
          ) : routerVerified === false ? (
            <ShieldAlert className="w-3 h-3 text-destructive" />
          ) : null}
          <span className="text-xs text-muted-foreground">
            {routerVerified === true ? "Pool verified" : routerVerified === false ? "Pool not available" : "Checking…"}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px]">{networkLabel}</Badge>
      </div>

      {/* Health Factor */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Health Factor</span>
          </div>
          <span className={`font-display text-xl font-bold ${
            healthFactor > 1.5 ? "text-primary" : healthFactor > 1 ? "text-yellow-500" : "text-destructive"
          }`}>
            {healthFactor > 0 ? healthFactor.toFixed(2) : "—"}
          </span>
        </div>
        <Progress value={Math.min(ltv * 100, 100)} className="h-2 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Collateral: ${collateralValue.toFixed(2)}</span>
          <span>Borrowed: ${borrowedValue.toFixed(2)}</span>
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
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <span className="font-medium">NTC</span>
            <span>{ntcBalance.toFixed(2)}</span>
            <span className="text-muted-foreground">${(ntcBalance * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <span className="font-medium">NTEV</span>
            <span>{ntevBalance.toFixed(2)}</span>
            <span className="text-muted-foreground">${(ntevBalance * 1.0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Lend / Borrow / Burn Tabs */}
      <Tabs defaultValue="lend">
        <TabsList className="w-full">
          <TabsTrigger value="lend" className="flex-1 gap-1 text-xs">
            <ArrowUpRight className="w-3 h-3" /> Lend
          </TabsTrigger>
          <TabsTrigger value="borrow" className="flex-1 gap-1 text-xs">
            <ArrowDownLeft className="w-3 h-3" /> Borrow
          </TabsTrigger>
          <TabsTrigger value="burn" className="flex-1 gap-1 text-xs">
            <Flame className="w-3 h-3" /> Burn
          </TabsTrigger>
        </TabsList>

        {/* LEND */}
        <TabsContent value="lend" className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Token to Lend</Label>
            <Select value={lendToken} onValueChange={setLendToken}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["USDC", "NTC", "NTEV", "USDm"].map(t => (
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
              value={lendAmount}
              onChange={(e) => setLendAmount(e.target.value)}
            />
          </div>
          <div className="text-xs p-2 rounded bg-primary/10 text-primary">
            Routed via Ubeswap pool • 0.3% fee • Output to treasury
          </div>
          <Button
            variant="glow"
            className="w-full"
            onClick={handleLend}
            disabled={!address || !lendAmount || isPending || routerVerified !== true}
          >
            {isPending && activeAction === "Lend" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lending…</>
            ) : (
              <><ArrowUpRight className="w-4 h-4 mr-1" /> Lend {lendToken}</>
            )}
          </Button>
        </TabsContent>

        {/* BORROW */}
        <TabsContent value="borrow" className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Token to Borrow</Label>
            <Select value={borrowToken} onValueChange={setBorrowToken}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["NTC", "NTEV", "USDC", "USDm"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Amount (in collateral token)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
            />
          </div>
          <div className="text-xs p-2 rounded bg-yellow-500/10 text-yellow-600">
            Swaps collateral via pool • Max LTV: 75% • Collateral: NTC / NTEV
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleBorrow}
            disabled={!address || !borrowAmount || isPending || routerVerified !== true}
          >
            {isPending && activeAction === "Borrow" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Borrowing…</>
            ) : (
              <><ArrowDownLeft className="w-4 h-4 mr-1" /> Borrow {borrowToken}</>
            )}
          </Button>
        </TabsContent>

        {/* BURN NTC */}
        <TabsContent value="burn" className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">NTC to Burn</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {ntcBalance.toFixed(4)} NTC
            </p>
          </div>
          <div className="text-xs p-2 rounded bg-destructive/10 text-destructive">
            ⚠ Burned NTC is sent to {BURN_ADDRESS.slice(0, 10)}… and is irrecoverable.
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleBurn}
            disabled={!address || !burnAmount || isPending || Number(burnAmount) <= 0}
          >
            {isPending && activeAction === "Burn NTC" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Burning…</>
            ) : (
              <><Flame className="w-4 h-4 mr-1" /> Burn {burnAmount || "0"} NTC</>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeFiActions;
