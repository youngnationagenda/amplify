import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { InvestorSidebar } from "@/components/investor/InvestorSidebar";
import { PortfolioOverview } from "@/components/investor/PortfolioOverview";
import { ROIDashboard } from "@/components/investor/ROIDashboard";
import { AssetBackedTokens } from "@/components/investor/AssetBackedTokens";
import { ICUOfferings } from "@/components/investor/ICUOfferings";
import { DeFiLending } from "@/components/investor/DeFiLending";
import { CarbonMarketplace } from "@/components/investor/CarbonMarketplace";
import { MotorcycleFinancing } from "@/components/investor/MotorcycleFinancing";
import { GovernanceAnalytics } from "@/components/investor/GovernanceAnalytics";

const InvestorPortal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <InvestorSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 bg-card/50 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">Investor Portal</span>
          </header>
          <div className="p-4 md:p-6 max-w-6xl">
            <Routes>
              <Route index element={<PortfolioOverview />} />
              <Route path="roi" element={<ROIDashboard />} />
              <Route path="abt" element={<AssetBackedTokens />} />
              <Route path="icu" element={<ICUOfferings />} />
              <Route path="defi" element={<DeFiLending />} />
              <Route path="marketplace" element={<CarbonMarketplace />} />
              <Route path="financing" element={<MotorcycleFinancing />} />
              <Route path="governance" element={<GovernanceAnalytics />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default InvestorPortal;
