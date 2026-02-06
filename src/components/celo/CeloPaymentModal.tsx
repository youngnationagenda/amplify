import { useState, useEffect } from "react";
import { useAccount, useBalance, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { celoSepolia } from "@/config/web3";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet, CheckCircle, AlertCircle, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { CELO_TOKENS, CUSD_ABI } from "@/config/web3";

interface CeloPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number; // USD amount
  onSuccess: (txHash: string) => void;
  description: string;
}

type PaymentToken = "CELO" | "cUSD";

// Treasury address (replace with actual treasury wallet)
const TREASURY_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

// Mock exchange rate: 1 CELO = $0.50 (in production, fetch from oracle)
const CELO_PRICE_USD = 0.5;

export function CeloPaymentModal({ open, onClose, amount, onSuccess, description }: CeloPaymentModalProps) {
  const [selectedToken, setSelectedToken] = useState<PaymentToken>("CELO");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  
  const { address, isConnected, chain } = useAccount();
  
  // Get CELO balance
  const { data: celoBalance } = useBalance({ address });
  
  // Get cUSD balance
  const chainId = chain?.id ?? celoSepolia.id;
  const cusdAddress = CELO_TOKENS[chainId as keyof typeof CELO_TOKENS]?.cUSD;
  
  const { data: cusdBalance } = useBalance({
    address,
    token: cusdAddress as `0x${string}`,
  });

  // Calculate amounts
  const celoAmount = amount / CELO_PRICE_USD;
  const cusdAmount = amount; // 1 cUSD ≈ 1 USD

  // CELO native transfer
  const { 
    sendTransaction, 
    isPending: isCeloSending, 
    data: celoTxHash,
    isError: isCeloError,
    reset: resetCelo 
  } = useSendTransaction();

  // cUSD ERC-20 transfer
  const {
    writeContract,
    isPending: isCusdSending,
    data: cusdTxHash,
    isError: isCusdError,
    reset: resetCusd
  } = useWriteContract();

  const txHash = selectedToken === "CELO" ? celoTxHash : cusdTxHash;
  const isSending = selectedToken === "CELO" ? isCeloSending : isCusdSending;
  const isError = selectedToken === "CELO" ? isCeloError : isCusdError;

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isConfirmed && txHash) {
      setPaymentStatus("success");
      onSuccess(txHash);
    }
  }, [isConfirmed, txHash, onSuccess]);

  useEffect(() => {
    if (isError) {
      setPaymentStatus("error");
    }
  }, [isError]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPaymentStatus("idle");
      resetCelo();
      resetCusd();
    }
  }, [open, resetCelo, resetCusd]);

  const handlePayment = () => {
    if (!address) return;
    setPaymentStatus("pending");

    if (selectedToken === "CELO") {
      sendTransaction({
        to: TREASURY_ADDRESS,
        value: parseEther(celoAmount.toFixed(18)),
      });
    } else {
      // cUSD ERC-20 transfer
      if (!cusdAddress || !chain) return;
      writeContract({
        address: cusdAddress as `0x${string}`,
        abi: CUSD_ABI,
        functionName: "transfer",
        args: [TREASURY_ADDRESS, parseUnits(cusdAmount.toFixed(2), 18)],
        chain,
        account: address,
      });
    }
  };

  const isPending = isSending || isConfirming;
  
  const formatBal = (balance: typeof celoBalance) => {
    if (!balance) return "0.00";
    return Number(formatUnits(balance.value, balance.decimals)).toFixed(4);
  };

  const payLabel = selectedToken === "CELO" 
    ? `Pay ${celoAmount.toFixed(2)} CELO` 
    : `Pay ${cusdAmount.toFixed(2)} cUSD`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[hsl(45,95%,55%)]" />
            Pay with Celo
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Display */}
          <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
            <p className="text-3xl font-bold text-foreground">${amount.toFixed(2)}</p>
          </div>

          {/* Token Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Payment Token</Label>
            <RadioGroup
              value={selectedToken}
              onValueChange={(v) => setSelectedToken(v as PaymentToken)}
              className="grid grid-cols-2 gap-3"
            >
              {/* CELO option */}
              <Label
                htmlFor="celo"
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedToken === "CELO"
                    ? "border-[hsl(45,95%,55%)] bg-[hsl(45,95%,55%)]/10"
                    : "border-border hover:border-[hsl(45,95%,55%)]/50"
                )}
              >
                <RadioGroupItem value="CELO" id="celo" className="sr-only" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(142,70%,48%)] to-[hsl(45,95%,55%)] flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-background">C</span>
                </div>
                <span className="font-semibold">CELO</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {celoAmount.toFixed(2)} CELO
                </span>
                <span className="text-xs text-muted-foreground">
                  Balance: {formatBal(celoBalance)}
                </span>
              </Label>

              {/* cUSD option */}
              <Label
                htmlFor="cusd"
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedToken === "cUSD"
                    ? "border-[hsl(200,90%,50%)] bg-[hsl(200,90%,50%)]/10"
                    : "border-border hover:border-[hsl(200,90%,50%)]/50"
                )}
              >
                <RadioGroupItem value="cUSD" id="cusd" className="sr-only" />
                <div className="w-10 h-10 rounded-full bg-[hsl(200,90%,50%)] flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-background">$</span>
                </div>
                <span className="font-semibold">cUSD</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {cusdAmount.toFixed(2)} cUSD
                </span>
                <span className="text-xs text-muted-foreground">
                  Balance: {formatBal(cusdBalance)}
                </span>
              </Label>
            </RadioGroup>
          </div>

          {/* Payment Status */}
          {paymentStatus === "success" && txHash && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-primary">Payment Successful!</p>
                <p className="text-xs text-muted-foreground truncate">
                  Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Payment Failed</p>
                <p className="text-xs text-muted-foreground">Please try again</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-[hsl(142,70%,48%)] to-[hsl(45,95%,55%)] text-background hover:opacity-90"
              onClick={handlePayment}
              disabled={!isConnected || isPending || paymentStatus === "success"}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isConfirming ? "Confirming..." : "Processing..."}
                </>
              ) : paymentStatus === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  {payLabel}
                </>
              )}
            </Button>
          </div>

          {/* Network Info */}
          <p className="text-xs text-center text-muted-foreground">
            Connected to {chain?.name || "Celo"} • Gas fees apply
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
