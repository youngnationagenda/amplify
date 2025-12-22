import { Clock, MapPin, Leaf, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ride {
  id: string;
  date: string;
  distance: number;
  duration: string;
  credits: number;
  energy: number;
  efficiency: number;
}

const RideHistory = () => {
  const rides: Ride[] = [
    { id: "1", date: "Today, 2:45 PM", distance: 12.4, duration: "45 min", credits: 0.124, energy: 2.8, efficiency: 96 },
    { id: "2", date: "Today, 9:30 AM", distance: 8.7, duration: "32 min", credits: 0.087, energy: 1.9, efficiency: 94 },
    { id: "3", date: "Yesterday, 6:15 PM", distance: 15.2, duration: "58 min", credits: 0.152, energy: 3.4, efficiency: 92 },
    { id: "4", date: "Yesterday, 8:00 AM", distance: 5.3, duration: "18 min", credits: 0.053, energy: 1.2, efficiency: 98 },
    { id: "5", date: "Dec 20, 4:30 PM", distance: 22.1, duration: "1h 15min", credits: 0.221, energy: 4.8, efficiency: 91 },
  ];

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-secondary/10">
            <Clock className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Recent Rides</h3>
            <p className="text-sm text-muted-foreground">IoT-validated trip data</p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          View All
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Ride List */}
      <div className="space-y-3">
        {rides.map((ride, index) => (
          <div
            key={ride.id}
            className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{ride.date}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                ride.efficiency >= 95 ? 'bg-success/20 text-success' :
                ride.efficiency >= 90 ? 'bg-primary/20 text-primary' :
                'bg-warning/20 text-warning'
              }`}>
                {ride.efficiency}% efficiency
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">Distance</span>
                </div>
                <p className="font-medium text-sm">{ride.distance} km</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">Duration</span>
                </div>
                <p className="font-medium text-sm">{ride.duration}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Leaf className="w-3 h-3" />
                  <span className="text-xs">Credits</span>
                </div>
                <p className="font-medium text-sm text-primary">{ride.credits.toFixed(3)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Zap className="w-3 h-3" />
                  <span className="text-xs">Energy</span>
                </div>
                <p className="font-medium text-sm">{ride.energy} kWh</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RideHistory;
