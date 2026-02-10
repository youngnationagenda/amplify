import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectWalletButton } from "@/components/celo/ConnectWalletButton";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Leaf, LogOut, User, TrendingUp, Coins, PieChart,
  BarChart3, Store, Landmark, Bike, ArrowLeft, LayoutDashboard,
  ShieldCheck, Wallet
} from "lucide-react";

const navItems = [
  { title: "Overview", url: "/investor-portal", icon: LayoutDashboard },
  { title: "ROI Dashboard", url: "/investor-portal/roi", icon: BarChart3 },
  { title: "Asset Tokens", url: "/investor-portal/abt", icon: Coins },
  { title: "ICU Offerings", url: "/investor-portal/icu", icon: TrendingUp },
  { title: "DeFi Lending", url: "/investor-portal/defi", icon: Landmark },
  { title: "Carbon Market", url: "/investor-portal/marketplace", icon: Store },
  { title: "Motorcycle Finance", url: "/investor-portal/financing", icon: Bike },
  { title: "Governance", url: "/investor-portal/governance", icon: ShieldCheck },
];

export function InvestorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const sidebar = useSidebar();
  const collapsed = sidebar.state === "collapsed";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-sm gradient-text block">Net Tribe Carbon</span>
              <p className="text-[10px] text-muted-foreground">Investor Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-muted-foreground text-[10px] uppercase tracking-widest">Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-[10px] uppercase tracking-widest">Wallet</SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <ConnectWalletButton />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate px-2">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{user?.email}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/investor-dashboard")} className="flex-1 text-xs">
            <ArrowLeft className="w-3 h-3" />
            {!collapsed && <span>Back</span>}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
