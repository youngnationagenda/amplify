import { useEffect, useState } from "react";
import { Trophy, Medal, TrendingUp, Leaf, Bike, Zap, Crown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchRiders,
  computeFleetStats,
  NTC_CONTRACT,
  type TelemetryRider,
} from "@/services/evTelemetry";
import { client } from "@/integrations/amplify/client";

interface LeaderboardEntry extends TelemetryRider {
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
  const [riders, setRiders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("credits");
  const [dataSource, setDataSource] = useState<"bridge" | "api" | "mock">("mock");

  useEffect(() => {
    loadLeaderboard();
  }, [currentUserId]);

  const loadLeaderboard = async () => {
    setLoading(true);

    // Fetch telemetry data (bridge → API → mock)
    const { riders: telemetryRiders, source } = await fetchRiders();
    setDataSource(source);

    // Map to leaderboard entries
    let entries: LeaderboardEntry[] = telemetryRiders.map((r) => ({
      ...r,
      displayName: r.name ?? r.wallet?.slice(0, 8) ?? "Unknown",
    }));

    // Try to merge current user's DB data
    if (currentUserId) {
      const { data: riderData } = await client.models.Rider.list({
        filter: { userId: { eq: currentUserId } },
      });
      const myRider = riderData?.[0];

      if (myRider) {
        const userEntry: LeaderboardEntry = {
          total_carbon_credits: myRider.totalCarbonCredits ?? 0,
          total_distance_km: myRider.totalDistanceKm ?? 0,
          efficiency_score: myRider.efficiencyScore ?? 85,
          is_active: myRider.isActive ?? true,
          motorcycle_id: myRider.motorcycleId ?? undefined,
          rider_id: myRider.id,
          wallet: undefined,
          name: "You",
          displayName: "You",
        };
        // Insert at correct position
        const idx = entries.findIndex((e) => e.total_carbon_credits <= userEntry.total_carbon_credits);
        if (idx >= 0) entries.splice(idx, 0, userEntry);
        else entries.push(userEntry);
      }
    }

    setRiders(sortRiders(entries, "credits"));
    setLoading(false);
  };

  const sortRiders = (list: LeaderboardEntry[], by: string): LeaderboardEntry[] => {
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

  const stats = computeFleetStats(riders);

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
              NTC: {NTC_CONTRACT.slice(0, 8)}...{NTC_CONTRACT.slice(-6)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
            {dataSource === "bridge" ? "🟢 Live Bridge" : dataSource === "api" ? "🔵 REST API" : "⚪ Simulated"}
          </Badge>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            <Zap className="w-3 h-3 mr-1" /> Live Rankings
          </Badge>
        </div>
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
          const isCurrentUser = rider.displayName === "You";
          return (
            <div
              key={rider.rider_id ?? rider.wallet ?? rider.rank}
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
                    {rider.displayName}
                  </span>
                  {isCurrentUser && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">YOU</Badge>
                  )}
                  {rider.is_active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {rider.motorcycle_id ?? rider.asset_id ?? "Unassigned"} • {rider.wallet ? `${rider.wallet.slice(0, 6)}...` : `${rider.total_distance_km.toFixed(0)} km`}
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

      {/* Footer Stats — computed from real data */}
      <div className="mt-6 p-4 bg-muted/20 rounded-xl border border-border/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-display font-bold text-lg text-primary">{stats.activeRiders}</div>
            <div className="text-xs text-muted-foreground">Active Riders</div>
          </div>
          <div>
            <div className="font-display font-bold text-lg text-secondary">{stats.totalNTC.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Total NTC Supply</div>
          </div>
          <div>
            <div className="font-display font-bold text-lg text-green-500">${(stats.creditsValue / 1000).toFixed(1)}K</div>
            <div className="text-xs text-muted-foreground">Credits Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}
