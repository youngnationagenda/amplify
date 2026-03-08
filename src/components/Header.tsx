import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap, Leaf, TrendingUp, Flame } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "#dashboard" },
    { name: "Carbon Credits", href: "#carbon" },
    { name: "EOT Invest", href: "#invest" },
    { name: "DeFi", href: "#defi" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              Net Tribe Carbon
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm font-medium"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/auth">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </a>
            <a href="/auth?portal=rider">
              <Button variant="outline" size="sm">
                <Zap className="w-4 h-4" />
                Rider
              </Button>
            </a>
            <a href="/auth?portal=offsetter">
              <Button variant="outline" size="sm" className="border-warning/50 text-warning hover:bg-warning/10">
                <Flame className="w-4 h-4" />
                Offsetter
              </Button>
            </a>
            <a href="/auth?portal=investor-portal">
              <Button variant="glow" size="sm">
                <TrendingUp className="w-4 h-4" />
                Investor
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <a href="/auth">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </a>
                <a href="/auth?portal=rider">
                  <Button variant="outline" className="w-full">
                    <Zap className="w-4 h-4" />
                    Rider Dashboard
                  </Button>
                </a>
                <a href="/auth?portal=offsetter">
                  <Button variant="outline" className="w-full border-warning/50 text-warning">
                    <Flame className="w-4 h-4" />
                    Offsetter Dashboard
                  </Button>
                </a>
                <a href="/auth?portal=investor-portal">
                  <Button variant="glow" className="w-full">
                    <TrendingUp className="w-4 h-4" />
                    Investor Portal
                  </Button>
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
