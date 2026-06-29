import { useState, useEffect } from "react";
import { useAccount, useBalance, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, formatUnits } from "viem";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wallet, CheckCircle, AlertCircle, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { getContracts, TOKEN_LABELS, TOKEN_DECIMALS, ERC20_ABI } from "@/config/defi";

interface CeloPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number; // USD amount
  onSuccess: (txHash: string) => void;
  description: string;
}

type PaymentToken = "CELO" | "USDC" | "USDm" | "NTC";

const TREASURY_ADDRESS = "0x57651B018Fa4aC931Ec585da641078988Ef1213B" as const;

// Mock exchange rates (in production, fetch from oracle/pool)
const TOKEN_PRICES_USD: Record<PaymentToken, number> = {
  CELO: 0.5,
  USDC: 1.0,
  USDm: 1.0,
  NTC: 0.1,
};

export function CeloPaymentModal({ open, onClose, amount, onSuccess, description }: CeloPaymentModalProps) {
  const [selectedToken, setSelectedToken] = useState<PaymentToken>("USDC");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const { address, isConnected, chain } = useAccount();
  const contracts = getContracts(chain?.id);

  const { data: celoBalance } = useBalance({ address });

  const { data: usdcRaw } = useBalance({ address, token: contracts.tokens.USDC });
  const { data: usdmRaw } = useBalance({ address, token: contracts.tokens.USDm });
  const { data: ntcRaw } = useBalance({ address, token: contracts.tokens.NTC });

  const tokenAmount = amount / TOKEN_PRICES_USD[selectedToken];
  const decimals = TOKEN_DECIMALS[selectedToken];

  const {
    sendTransaction,
    isPending: isCeloSending,
    data: celoTxHash,
    isError: isCeloError,
    reset: resetCelo,
  } = useSendTransaction();

  const {
    writeContract,
    isPending: isErcSending,
    data: ercTxHash,
    isError: isErcError,
    reset: resetErc,
  } = useWriteContract();

  const txHash = selectedToken === "CELO" ? celoTxHash : ercTxHash;
  const isSending = selectedToken === "CELO" ? isCeloSending : isErcSending;
  const isError = selectedToken === "CELO" ? isCeloError : isErcError;

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed && txHash) {
      setPaymentStatus("success");
      onSuccess(txHash);
    }
  }, [isConfirmed, txHash, onSuccess]);

  useEffect(() => {
    if (isError) setPaymentStatus("error");
  }, [isError]);

  useEffect(() => {
    if (open) {
      setPaymentStatus("idle");
      resetCelo();
      resetErc();
    }
  }, [open, resetCelo, resetErc]);

  const handlePayment = () => {
    if (!address || !chain) return;
    setPaymentStatus("pending");

    if (selectedToken === "CELO") {
      sendTransaction({
        to: TREASURY_ADDRESS,
        value: parseEther(tokenAmount.toFixed(18)),
      });
    } else {
      const tokenAddress = contracts.tokens[selectedToken as keyof typeof contracts.tokens];
      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [TREASURY_ADDRESS, parseUnits(tokenAmount.toFixed(decimals > 6 ? 8 : 2), decimals)],
        chain,
        account: address,
      });
      // For simplicity, doing transfer via approve+transfer pattern
      // In production, use a payment contract
      writeContract({
        address: tokenAddress,
        abi: [
          {
            name: "transfer",
            type: "function",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ] as const,
        functionName: "transfer",
        args: [TREASURY_ADDRESS, parseUnits(tokenAmount.toFixed(decimals > 6 ? 8 : 2), decimals)],
        chain,
        account: address,
      });
    }
  };

  const isPending = isSending || isConfirming;

  const getBalance = (token: PaymentToken) => {
    switch (token) {
      case "CELO": return celoBalance ? Number(formatUnits(celoBalance.value, celoBalance.decimals)).toFixed(4) : "0.00";
      case "USDC": return usdcRaw ? Number(formatUnits(usdcRaw.value, usdcRaw.decimals)).toFixed(2) : "0.00";
      case "USDm": return usdmRaw ? Number(formatUnits(usdmRaw.value, usdmRaw.decimals)).toFixed(4) : "0.00";
      case "NTC": return ntcRaw ? Number(formatUnits(ntcRaw.value, ntcRaw.decimals)).toFixed(4) : "0.00";
    }
  };

  const paymentTokens: PaymentToken[] = ["USDC", "USDm", "CELO", "NTC"];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Choose Payment Token
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Display */}
          <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
            <p className="text-3xl font-bold text-foreground">${amount.toFixed(2)}</p>
          </div>

          {/* Token Selection Dropdown */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pay With</Label>
            <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v as PaymentToken)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentTokens.map((token) => (
                  <SelectItem key={token} value={token}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{token}</span>
                      <span className="text-xs text-muted-foreground">{TOKEN_LABELS[token]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected token details */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You Pay</span>
                <span className="font-bold">{tokenAmount.toFixed(4)} {selectedToken}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Balance</span>
                <span>{getBalance(selectedToken)} {selectedToken}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rate</span>
                <span>1 {selectedToken} = ${TOKEN_PRICES_USD[selectedToken]}</span>
              </div>
            </div>
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
              variant="glow"
              className="flex-1"
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
                  Pay {tokenAmount.toFixed(2)} {selectedToken}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Connected to {chain?.name || "Celo"} • Gas fees apply
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
