import { Bike, Zap, Leaf, DollarSign, Activity, Battery, MapPin, Gauge } from "lucide-react";
import MetricCard from "./MetricCard";
import CarbonCalculator from "./CarbonCalculator";
import RideHistory from "./RideHistory";

const Dashboard = () => {
  const metrics = [
    { title: "Total Rides", value: "1,247", change: 12.5, icon: <Bike className="w-5 h-5" />, trend: "up" as const },
    { title: "Carbon Credits Earned", value: "89.4", suffix: "tCO₂", change: 8.3, icon: <Leaf className="w-5 h-5" />, trend: "up" as const },
    { title: "Distance Covered", value: "45,892", suffix: "km", change: 15.2, icon: <MapPin className="w-5 h-5" />, trend: "up" as const },
    { title: "Energy Consumed", value: "2,340", suffix: "kWh", change: -3.2, icon: <Battery className="w-5 h-5" />, trend: "down" as const },
    { title: "Token Value", value: "$8,940", change: 22.1, icon: <DollarSign className="w-5 h-5" />, trend: "up" as const },
    { title: "Active Riders", value: "120", change: 5.8, icon: <Activity className="w-5 h-5" />, trend: "up" as const },
    { title: "Avg. Efficiency", value: "92", suffix: "%", change: 2.4, icon: <Gauge className="w-5 h-5" />, trend: "up" as const },
    { title: "IoT Devices", value: "156", change: 10.0, icon: <Zap className="w-5 h-5" />, trend: "up" as const },
  ];

  return (
    <section id="dashboard" className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Real-Time Analytics</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Platform <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track carbon credits, monitor ride metrics, and analyze IoT data from your electric motorcycle fleet.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <MetricCard {...metric} />
            </div>
          ))}
        </div>

        {/* Carbon Calculator & Ride History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CarbonCalculator />
          <RideHistory />
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
