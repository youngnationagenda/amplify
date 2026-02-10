import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Web3Provider } from "@/providers/Web3Provider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RiderDashboard from "./pages/RiderDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import InvestorPortal from "./pages/InvestorPortal";
import OffseterDashboard from "./pages/OffseterDashboard";
import NotFound from "./pages/NotFound";

const App = () => (
  <Web3Provider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/rider-dashboard" element={<RiderDashboard />} />
            <Route path="/investor-dashboard" element={<InvestorDashboard />} />
            <Route path="/investor-portal/*" element={<InvestorPortal />} />
            <Route path="/offsetter-dashboard" element={<OffseterDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </Web3Provider>
);

export default App;
