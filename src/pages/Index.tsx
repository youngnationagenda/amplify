import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import EOTInvestment from "@/components/EOTInvestment";
import DeFiSection from "@/components/DeFiSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <Dashboard />
        <EOTInvestment />
        <DeFiSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
