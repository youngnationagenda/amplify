import { useState, useEffect } from "react";
import { Leaf, Zap, MapPin, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
const CarbonCalculator = () => {
  const [distance, setDistance] = useState(0);
  const [credits, setCredits] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Simulate real-time IoT data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setDistance(prev => {
        const newDistance = prev + Math.random() * 0.5;
        // Generate credits every 100m to 1km
        if (Math.floor(newDistance / 0.1) > Math.floor(prev / 0.1)) {
          setCredits(c => c + 0.01); // 0.01 token per 100m
        }
        return newDistance;
      });
      setTimeout(() => setIsAnimating(false), 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  const progressToNextToken = credits % 1 * 100;
  return <div className="glass-card p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <Leaf className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold">Carbon Credit Calculator</h3>
          <p className="text-sm text-muted-foreground">AI-powered real-time validation</p>
        </div>
      </div>

      {/* Live Data Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">Aggregated Distance (km)</span>
          </div>
          <p className={`font-display text-2xl font-bold ${isAnimating ? 'text-primary' : 'text-foreground'} transition-colors`}>
            {distance.toFixed(2)}
          </p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Credits Earned</span>
          </div>
          <p className={`font-display text-2xl font-bold ${isAnimating ? 'text-secondary' : 'text-foreground'} transition-colors`}>
            {credits.toFixed(3)}
          </p>
        </div>
      </div>

      {/* Progress to Next Full Token */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress to next token</span>
          <span className="text-primary font-medium">{progressToNextToken.toFixed(0)}%</span>
        </div>
        <Progress value={progressToNextToken} className="h-3 bg-muted" />
        <p className="text-xs text-muted-foreground mt-2">
          1 Carbon Credit Token = $100 | 10 Tokens = 1 Ton CO₂
        </p>
      </div>

      {/* Rider Behavior Score */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Rider Efficiency Score</p>
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-bold text-primary">94</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="p-3 rounded-full bg-primary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Based on acceleration patterns, braking, and energy consumption
        </p>
      </div>
    </div>;
};
export default CarbonCalculator;