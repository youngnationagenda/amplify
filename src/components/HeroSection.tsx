import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
      <div className="hero-glow top-1/4 left-1/4 animate-pulse-glow" />
      <div className="hero-glow bottom-1/4 right-1/4 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      {/* Floating Elements */}
      <div className="absolute top-1/3 left-10 w-20 h-20 rounded-full bg-primary/10 blur-xl animate-float" />
      <div className="absolute bottom-1/3 right-10 w-32 h-32 rounded-full bg-secondary/10 blur-xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary font-medium">Powered by IoT & Blockchain</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            Transform Every Ride Into{" "}
            <span className="gradient-text">Carbon Credits</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            AI-powered carbon credit validation for electric motorcycles. 
            Earn tokens per kilometer, invest in asset-backed mobility, 
            and access DeFi financing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="glow" size="xl">
              Start Earning Credits
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl">
              Explore Investments
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { value: "120", label: "Electric Motorcycles", icon: Zap },
              { value: "576", label: "Carbon Credits", icon: TrendingUp },
              { value: "$100", label: "Per Credit", icon: Shield },
              { value: "$57,600", label: "Total Value", icon: Shield },
            ].map((stat, index) => (
              <div
                key={index}
                className="glass-card p-4 text-center group hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex justify-center mb-2">
                  <stat.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-display text-2xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
