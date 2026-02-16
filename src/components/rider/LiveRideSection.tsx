import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Battery, Activity, Gauge, Play, Square, Leaf } from "lucide-react";

interface LiveRideSectionProps {
  isRiding: boolean;
  setIsRiding: (v: boolean) => void;
  distance: number;
  credits: number;
  speed: number;
  battery: number;
  efficiency: number;
}

export default function LiveRideSection({
  isRiding, setIsRiding, distance, credits, speed, battery, efficiency
}: LiveRideSectionProps) {
  const creditsProgress = (credits % 1) * 100;
  const totalCredits = Math.floor(credits);

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold mb-1">Live Ride Tracking</h2>
          <p className="text-muted-foreground">Real-time carbon credit generation</p>
        </div>
        <Button
          variant={isRiding ? "destructive" : "glow"}
          size="lg"
          onClick={() => setIsRiding(!isRiding)}
        >
          {isRiding ? (
            <><Square className="w-5 h-5" /> Stop Ride</>
          ) : (
            <><Play className="w-5 h-5" /> Start Ride</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricTile icon={<MapPin className="w-4 h-4 text-primary" />} label="Distance" value={`${(distance / 1000).toFixed(2)}`} unit="km" />
        <MetricTile icon={<Gauge className="w-4 h-4 text-secondary" />} label="Speed" value={`${speed}`} unit="km/h" />
        <MetricTile icon={<Battery className="w-4 h-4 text-green-500" />} label="Battery" value={`${battery.toFixed(0)}`} unit="%" />
        <MetricTile icon={<Activity className="w-4 h-4 text-yellow-500" />} label="Efficiency" value={`${efficiency.toFixed(0)}`} unit="%" />
      </div>

      <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Carbon Credits Earned</h3>
              <p className="text-sm text-muted-foreground">This ride session</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold gradient-text">{credits.toFixed(4)}</div>
            <div className="text-sm text-muted-foreground">tCO₂e</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to next credit</span>
            <span className="text-primary font-medium">{creditsProgress.toFixed(0)}%</span>
          </div>
          <Progress value={creditsProgress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {totalCredits} complete credits earned • Generating at {(efficiency / 100 * 4.8).toFixed(2)} credits/km
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="p-4 bg-background/50 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold">
        {value} <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
