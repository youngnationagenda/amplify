import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getAddressTransactions, BlockscoutTransaction, txUrl } from "@/services/blockscout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, History, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatUnits } from "viem";

const TransactionHistory = () => {
  const { address, chain } = useAccount();
  const [txs, setTxs] = useState<BlockscoutTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chainId = chain?.id ?? 11142220;

  const fetchTxs = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAddressTransactions(chainId, address, 15);
      setTxs(data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [address, chainId]);

  const isOutgoing = (tx: BlockscoutTransaction) =>
    tx.from.hash.toLowerCase() === address?.toLowerCase();

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h4 className="font-display font-bold text-sm">Recent Transactions</h4>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchTxs} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && txs.length === 0 && (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading transactions…
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive p-2 bg-destructive/10 rounded">{error}</p>
      )}

      {!loading && txs.length === 0 && !error && (
        <p className="text-xs text-muted-foreground text-center py-4">No transactions found</p>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {txs.map((tx) => {
          const out = isOutgoing(tx);
          const value = tx.value ? Number(formatUnits(BigInt(tx.value), 18)) : 0;
          const timeAgo = tx.timestamp
            ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })
            : "";

          return (
            <div
              key={tx.hash}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/30 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  out ? "bg-destructive/10" : "bg-primary/10"
                }`}>
                  {out ? (
                    <ArrowUpRight className="w-4 h-4 text-destructive" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {tx.method || (out ? "Send" : "Receive")}
                    </span>
                    <Badge
                      variant={tx.status === "ok" ? "default" : "destructive"}
                      className="text-[9px] h-4"
                    >
                      {tx.status === "ok" ? "Success" : tx.status || "Pending"}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {value > 0 && (
                  <span className={`text-xs font-bold ${out ? "text-destructive" : "text-primary"}`}>
                    {out ? "-" : "+"}{value.toFixed(4)} CELO
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <a href={txUrl(chainId, tx.hash)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionHistory;
