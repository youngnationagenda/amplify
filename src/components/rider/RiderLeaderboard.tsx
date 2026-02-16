import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, Leaf, Bike, Zap, Crown, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// NTC Contract reference (Celo Sepolia)
const NTC_CONTRACT = "0xde6dBD244fBE84141a97DDe4043029D9c61767AE";
const EV_ASSET_CONTRACT = "0xCdB1d119Eda8f7A04a820b5002ef2ea8b189bb18";

interface RiderEntry {
  id: string;
  user_id: string;
  total_carbon_credits: number;
  total_distance_km: number;
  efficiency_score: number;
  is_active: boolean;
  motorcycle_id: string | null;
  rank?: number;
  displayName?: string;
}

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-yellow-400" />,
  2: <Medal className="w-5 h-5 text-gray-300" />,
  3: <Medal className="w-5 h-5 text-amber-600" />,
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank <= 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
        {rankIcons[rank]}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 border border-border/50">
      <span className="font-display font-bold text-sm text-muted-foreground">#{rank}</span>
    </div>
  );
};

export default function RiderLeaderboard({ currentUserId }: { currentUserId?: string }) {
  const [riders, setRiders] = useState<RiderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("credits");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    // Fetch all riders - RLS restricts to own data, so we use a public view approach
    // For demo, we generate mock leaderboard data enriched with any real rider data
    const { data: myRider } = await supabase
      .from("riders")
      .select("*")
      .eq("user_id", currentUserId ?? "")
      .maybeSingle();

    // Generate realistic leaderboard entries
    const mockRiders: RiderEntry[] = [
      { id: "r1", user_id: "u1", total_carbon_credits: 48.2, total_distance_km: 1245, efficiency_score: 96, is_active: true, motorcycle_id: "NTC-MC-0012", displayName: "KE-Rider-Alpha" },
      { id: "r2", user_id: "u2", total_carbon_credits: 42.7, total_distance_km: 1102, efficiency_score: 94, is_active: true, motorcycle_id: "NTC-MC-0008", displayName: "MachakosEV" },
      { id: "r3", user_id: "u3", total_carbon_credits: 38.1, total_distance_km: 987, efficiency_score: 91, is_active: true, motorcycle_id: "NTC-MC-0031", displayName: "GreenRider_KE" },
      { id: "r4", user_id: "u4", total_carbon_credits: 31.5, total_distance_km: 812, efficiency_score: 89, is_active: true, motorcycle_id: "NTC-MC-0005", displayName: "NairobiEco" },
      { id: "r5", user_id: "u5", total_carbon_credits: 27.9, total_distance_km: 723, efficiency_score: 87, is_active: true, motorcycle_id: "NTC-MC-0019", displayName: "CeloRider01" },
      { id: "r6", user_id: "u6", total_carbon_credits: 22.4, total_distance_km: 580, efficiency_score: 85, is_active: true, motorcycle_id: "NTC-MC-0027", displayName: "EV_Pioneer" },
      { id: "r7", user_id: "u7", total_carbon_credits: 18.6, total_distance_km: 482, efficiency_score: 83, is_active: true, motorcycle_id: "NTC-MC-0044", displayName: "KisiiGreen" },
      { id: "r8", user_id: "u8", total_carbon_credits: 14.2, total_distance_km: 368, efficiency_score: 80, is_active: true, motorcycle_id: "NTC-MC-0003", displayName: "MombasaEV" },
      { id: "r9", user_id: "u9", total_carbon_credits: 9.8, total_distance_km: 254, efficiency_score: 78, is_active: true, motorcycle_id: "NTC-MC-0051", displayName: "RiderKE_09" },
      { id: "r10", user_id: "u10", total_carbon_credits: 5.1, total_distance_km: 132, efficiency_score: 75, is_active: false, motorcycle_id: "NTC-MC-0062", displayName: "NewRider_KE" },
    ];

    // Insert current user into leaderboard if they exist
    if (myRider) {
      const existing = mockRiders.findIndex(r => r.total_carbon_credits <= (myRider.total_carbon_credits ?? 0));
      const entry: RiderEntry = {
        ...myRider,
        total_carbon_credits: myRider.total_carbon_credits ?? 0,
        total_distance_km: myRider.total_distance_km ?? 0,
        efficiency_score: myRider.efficiency_score ?? 85,
        is_active: myRider.is_active ?? true,
        displayName: "You",
      };
      if (existing >= 0) {
        mockRiders.splice(existing, 0, entry);
      } else {
        mockRiders.push(entry);
      }
    }

    // Assign ranks
    const sorted = sortRiders(mockRiders, "credits");
    setRiders(sorted);
    setLoading(false);
  };

  const sortRiders = (list: RiderEntry[], by: string): RiderEntry[] => {
    const copy = [...list];
    if (by === "credits") copy.sort((a, b) => b.total_carbon_credits - a.total_carbon_credits);
    else if (by === "distance") copy.sort((a, b) => b.total_distance_km - a.total_distance_km);
    else if (by === "efficiency") copy.sort((a, b) => b.efficiency_score - a.efficiency_score);
    return copy.map((r, i) => ({ ...r, rank: i + 1 }));
  };

  const handleTabChange = (value: string) => {
    setTab(value);
    setRiders(sortRiders(riders, value));
  };

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-8 bg-muted/50 rounded w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Rider Leaderboard</h2>
            <p className="text-xs text-muted-foreground">
              NTC Contract: {NTC_CONTRACT.slice(0, 8)}...{NTC_CONTRACT.slice(-6)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          <Zap className="w-3 h-3 mr-1" /> Live Rankings
        </Badge>
      </div>

      {/* Sort Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange} className="mb-4">
        <TabsList className="bg-muted/30 border border-border/50">
          <TabsTrigger value="credits" className="text-xs gap-1">
            <Leaf className="w-3 h-3" /> NTC Credits
          </TabsTrigger>
          <TabsTrigger value="distance" className="text-xs gap-1">
            <Bike className="w-3 h-3" /> Distance
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="text-xs gap-1">
            <TrendingUp className="w-3 h-3" /> Efficiency
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {riders.slice(0, 10).map((rider) => {
          const isCurrentUser = rider.user_id === currentUserId || rider.displayName === "You";
          return (
            <div
              key={rider.id}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                isCurrentUser
                  ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20"
                  : rider.rank! <= 3
                  ? "bg-gradient-to-r from-muted/40 to-transparent border border-border/30"
                  : "bg-muted/20 border border-border/20"
              }`}
            >
              <RankBadge rank={rider.rank!} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-sm truncate">
                    {rider.displayName ?? `Rider-${rider.id.slice(0, 6)}`}
                  </span>
                  {isCurrentUser && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">YOU</Badge>
                  )}
                  {rider.is_active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {rider.motorcycle_id ?? "Unassigned"} • {rider.total_distance_km.toFixed(0)} km
                </p>
              </div>

              <div className="text-right">
                <div className="font-display font-bold text-sm">
                  {tab === "credits" && <>{rider.total_carbon_credits.toFixed(1)} <span className="text-xs text-muted-foreground">NTC</span></>}
                  {tab === "distance" && <>{rider.total_distance_km.toFixed(0)} <span className="text-xs text-muted-foreground">km</span></>}
                  {tab === "efficiency" && <>{rider.efficiency_score.toFixed(0)}<span className="text-xs text-muted-foreground">%</span></>}
                </div>
                <div className="flex items-center justify-end gap-1 text-xs text-green-500">
                  <ChevronUp className="w-3 h-3" />
                  <span>+{(Math.random() * 5 + 1).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 p-4 bg-muted/20 rounded-xl border border-border/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-display font-bold text-lg text-primary">120</div>
            <div className="text-xs text-muted-foreground">Active Riders</div>
          </div>
          <div>
            <div className="font-display font-bold text-lg text-secondary">576</div>
            <div className="text-xs text-muted-foreground">Total NTC Supply</div>
          </div>
          <div>
            <div className="font-display font-bold text-lg text-green-500">$57.6K</div>
            <div className="text-xs text-muted-foreground">Credits Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}
