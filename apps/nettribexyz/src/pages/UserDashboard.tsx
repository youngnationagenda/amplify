import { useNavigate } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, LogOut, TrendingUp, ArrowUpDown, Wallet } from "lucide-react";
import { ConnectWalletButton } from "@/components/celo/ConnectWalletButton";
import WalletPanel from "@/components/wallet/WalletPanel";
import SwapPanel from "@/components/wallet/SwapPanel";
import { CarbonMarketplace } from "@/components/investor/CarbonMarketplace";
import { getContracts, ERC20_ABI } from "@/config/defi";

const UserDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { address, isConnected, chain } = useAccount();
  const contracts = getContracts(chain?.id);

  // Read NTC balance for portfolio value
  const { data: ntcBalanceRaw } = useReadContract({
    address: contracts.tokens.NTC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const ntcBalance = ntcBalanceRaw ? Number(formatUnits(ntcBalanceRaw as bigint, 18)) : 0;
  const portfolioValue = ntcBalance * 0.1; // NTC price ~$0.10

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Trader Dashboard</h1>
              <p className="text-xs text-muted-foreground">Carbon Credit Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConnectWalletButton />
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.fullName || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold mb-2">
            Welcome, {user?.fullName || "Trader"}
          </h2>
          <p className="text-muted-foreground">
            Buy, sell, and trade verified carbon credits on the marketplace.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-muted-foreground">Portfolio Value</span>
            </div>
            <div className="text-2xl font-bold">${portfolioValue.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">{ntcBalance.toFixed(2)} NTC held</div>
          </div>

          <div className="p-6 rounded-2xl border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpDown className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Network</span>
            </div>
            <div className="text-2xl font-bold">{chain?.name || "Not Connected"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect wallet to trade"}
            </div>
          </div>

          <div className="p-6 rounded-2xl border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">NTC Market Price</span>
            </div>
            <div className="text-2xl font-bold">$0.10</div>
            <div className="text-xs text-green-500 mt-1">NTC / USDC pool</div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="swap">Swap</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
            <CarbonMarketplace />
          </TabsContent>

          <TabsContent value="swap">
            <div className="max-w-lg">
              <SwapPanel />
            </div>
          </TabsContent>

          <TabsContent value="wallet">
            <WalletPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;
