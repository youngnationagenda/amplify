import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Leaf, LogOut, TrendingUp, ArrowUpDown, Wallet } from "lucide-react";

const UserDashboard = () => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();

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
            <span className="text-sm text-muted-foreground">
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
            <div className="text-2xl font-bold">$0.00</div>
            <div className="text-xs text-muted-foreground mt-1">0 credits held</div>
          </div>

          <div className="p-6 rounded-2xl border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpDown className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Trades Today</span>
            </div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-muted-foreground mt-1">No trades yet</div>
          </div>

          <div className="p-6 rounded-2xl border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Market Price</span>
            </div>
            <div className="text-2xl font-bold">$8.50</div>
            <div className="text-xs text-green-500 mt-1">+2.4% today</div>
          </div>
        </div>

        {/* Marketplace placeholder */}
        <div className="p-12 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Marketplace Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            The carbon credit trading marketplace is under development. You'll be able to buy, sell, and trade verified carbon credits here.
          </p>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
