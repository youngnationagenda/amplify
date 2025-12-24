import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Leaf, 
  Flame, 
  TrendingDown, 
  ShoppingCart, 
  Award, 
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle,
  LogOut,
  Zap
} from "lucide-react";

interface CarbonCredit {
  id: string;
  amount: number;
  price_per_credit: number;
  source_type: string;
  status: string;
}

interface ICO {
  id: string;
  name: string;
  description: string;
  total_credits: number;
  credits_sold: number;
  price_per_credit: number;
  market_price: number;
  start_date: string;
  end_date: string;
  delivery_date: string;
  status: string;
}

interface Purchase {
  id: string;
  amount: number;
  price_paid: number;
  status: string;
  burned_at: string | null;
  created_at: string;
}

interface BurnedCredit {
  id: string;
  amount: number;
  certificate_number: string;
  burned_at: string;
}

const OffseterDashboard = () => {
  const { user, loading, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [icos, setIcos] = useState<ICO[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [burnedCredits, setBurnedCredits] = useState<BurnedCredit[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(10);
  const [selectedCredit, setSelectedCredit] = useState<string | null>(null);
  const [icoAmount, setIcoAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch available credits
    const { data: creditsData } = await supabase
      .from('carbon_credits')
      .select('*')
      .eq('status', 'available');
    if (creditsData) setCredits(creditsData);

    // Fetch active ICOs
    const { data: icosData } = await supabase
      .from('initial_carbon_offerings')
      .select('*')
      .in('status', ['upcoming', 'active']);
    if (icosData) setIcos(icosData);

    // Fetch user purchases
    const { data: purchasesData } = await supabase
      .from('carbon_purchases')
      .select('*')
      .order('created_at', { ascending: false });
    if (purchasesData) setPurchases(purchasesData);

    // Fetch burned credits
    const { data: burnedData } = await supabase
      .from('burned_credits')
      .select('*')
      .order('burned_at', { ascending: false });
    if (burnedData) setBurnedCredits(burnedData);
  };

  const handlePurchaseCredits = async (creditId: string, amount: number, pricePerCredit: number) => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('carbon_purchases')
        .insert({
          user_id: user.id,
          credit_id: creditId,
          amount,
          price_paid: amount * pricePerCredit,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Purchase Successful!",
        description: `You purchased ${amount} carbon credits for $${(amount * pricePerCredit).toFixed(2)}`
      });
      
      fetchData();
      setSelectedCredit(null);
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBurnCredits = async (purchase: Purchase) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // Generate certificate number
      const certificateNumber = `EOT-BURN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${purchase.id.slice(0, 8)}`;

      // Create burn record
      const { error: burnError } = await supabase
        .from('burned_credits')
        .insert({
          user_id: user.id,
          purchase_id: purchase.id,
          amount: purchase.amount,
          certificate_number: certificateNumber
        });

      if (burnError) throw burnError;

      // Update purchase status
      const { error: updateError } = await supabase
        .from('carbon_purchases')
        .update({ status: 'burned', burned_at: new Date().toISOString() })
        .eq('id', purchase.id);

      if (updateError) throw updateError;

      toast({
        title: "Credits Burned Successfully! 🔥",
        description: `${purchase.amount} credits permanently retired. Certificate: ${certificateNumber}`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Burn Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleICOPurchase = async (ico: ICO, amount: number) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('ico_purchases')
        .insert({
          user_id: user.id,
          ico_id: ico.id,
          credits_purchased: amount,
          price_paid: amount * ico.price_per_credit,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "ICO Purchase Successful!",
        description: `Reserved ${amount} future credits at $${ico.price_per_credit}/credit (${Math.round((1 - ico.price_per_credit / ico.market_price) * 100)}% discount!)`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const totalAvailableCredits = credits.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalPurchased = purchases.filter(p => p.status === 'active').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalBurned = burnedCredits.reduce((sum, b) => sum + Number(b.amount), 0);
  const activePurchases = purchases.filter(p => p.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-destructive flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Offsetter Dashboard</h1>
              <p className="text-sm text-muted-foreground">Buy & Burn Carbon Credits</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-warning/50 text-warning">
              <Flame className="w-3 h-3 mr-1" />
              Offsetter
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Credits</p>
                  <p className="text-2xl font-bold">{totalAvailableCredits.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/20">
                  <ShoppingCart className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Credits</p>
                  <p className="text-2xl font-bold">{totalPurchased.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning/20">
                  <Flame className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Burned</p>
                  <p className="text-2xl font-bold">{totalBurned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-destructive/20">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CO₂ Offset</p>
                  <p className="text-2xl font-bold">{(totalBurned * 0.5).toFixed(1)} tons</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="marketplace" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="ico" className="gap-2">
              <Zap className="w-4 h-4" />
              Initial Carbon Offering
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <Leaf className="w-4 h-4" />
              My Credits
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="w-4 h-4" />
              Burn Certificates
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Carbon Credit Marketplace
                </CardTitle>
                <CardDescription>
                  Purchase verified carbon credits generated by our electric motorcycle fleet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {credits.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No credits available at the moment</p>
                    <p className="text-sm">Check back soon or explore our ICO offerings</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {credits.map((credit) => (
                      <div 
                        key={credit.id} 
                        className="p-4 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/20">
                            <Leaf className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{Number(credit.amount).toLocaleString()} Carbon Credits</p>
                            <p className="text-sm text-muted-foreground">
                              Source: {credit.source_type === 'ride' ? 'Electric Motorcycle Rides' : 'ICO'} • ${Number(credit.price_per_credit).toFixed(2)}/credit
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedCredit === credit.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={purchaseAmount}
                                onChange={(e) => setPurchaseAmount(Math.min(Number(e.target.value), Number(credit.amount)))}
                                className="w-24"
                                min={1}
                                max={Number(credit.amount)}
                              />
                              <Button 
                                variant="glow" 
                                size="sm"
                                onClick={() => handlePurchaseCredits(credit.id, purchaseAmount, Number(credit.price_per_credit))}
                                disabled={isProcessing}
                              >
                                ${(purchaseAmount * Number(credit.price_per_credit)).toFixed(2)}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedCredit(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedCredit(credit.id);
                                setPurchaseAmount(Math.min(10, Number(credit.amount)));
                              }}
                            >
                              Buy Credits
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ICO Tab */}
          <TabsContent value="ico" className="space-y-6">
            <Card className="glass-card border-warning/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-warning" />
                  <div>
                    <CardTitle>Initial Carbon Offering (ICO)</CardTitle>
                    <CardDescription>
                      Buy future carbon credits at discounted prices. Save up to 30% compared to market rates!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {icos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active ICOs at the moment</p>
                    <p className="text-sm">New offerings coming soon!</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {icos.map((ico) => {
                      const progress = (Number(ico.credits_sold) / Number(ico.total_credits)) * 100;
                      const discount = Math.round((1 - Number(ico.price_per_credit) / Number(ico.market_price)) * 100);
                      const isActive = ico.status === 'active';
                      
                      return (
                        <div 
                          key={ico.id} 
                          className={`p-6 rounded-xl border ${isActive ? 'border-warning/50 bg-warning/5' : 'border-border/50 bg-muted/20'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-display font-bold text-lg">{ico.name}</h3>
                                <Badge variant={isActive ? "default" : "secondary"}>
                                  {isActive ? 'Active' : 'Upcoming'}
                                </Badge>
                                <Badge variant="outline" className="border-warning/50 text-warning">
                                  {discount}% OFF
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm">{ico.description}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">ICO Price</p>
                              <p className="font-bold text-primary">${Number(ico.price_per_credit).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Market Price</p>
                              <p className="font-bold line-through text-muted-foreground">${Number(ico.market_price).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Supply</p>
                              <p className="font-bold">{Number(ico.total_credits).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Delivery Date</p>
                              <p className="font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(ico.delivery_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Sold</span>
                              <span>{Number(ico.credits_sold).toLocaleString()} / {Number(ico.total_credits).toLocaleString()}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          {isActive && (
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Amount to buy</Label>
                                <Input
                                  type="number"
                                  value={icoAmount}
                                  onChange={(e) => setIcoAmount(Number(e.target.value))}
                                  className="mt-1"
                                  min={1}
                                  max={Number(ico.total_credits) - Number(ico.credits_sold)}
                                />
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Cost</p>
                                <p className="font-bold text-lg">${(icoAmount * Number(ico.price_per_credit)).toFixed(2)}</p>
                                <p className="text-xs text-success">
                                  Save ${(icoAmount * (Number(ico.market_price) - Number(ico.price_per_credit))).toFixed(2)}
                                </p>
                              </div>
                              <Button 
                                variant="glow"
                                onClick={() => handleICOPurchase(ico, icoAmount)}
                                disabled={isProcessing}
                              >
                                Reserve Credits
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          )}

                          {!isActive && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">Starts {new Date(ico.start_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-primary" />
                  My Carbon Credits
                </CardTitle>
                <CardDescription>
                  Credits you own that can be burned to offset carbon emissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activePurchases.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>You don't own any credits yet</p>
                    <p className="text-sm">Purchase credits from the marketplace or ICO</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activePurchases.map((purchase) => (
                      <div 
                        key={purchase.id} 
                        className="p-4 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/20">
                            <Leaf className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{Number(purchase.amount).toLocaleString()} Carbon Credits</p>
                            <p className="text-sm text-muted-foreground">
                              Purchased {new Date(purchase.created_at).toLocaleDateString()} • ${Number(purchase.price_paid).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive"
                          onClick={() => handleBurnCredits(purchase)}
                          disabled={isProcessing}
                          className="gap-2"
                        >
                          <Flame className="w-4 h-4" />
                          Burn Credits
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <Card className="glass-card border-warning/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-warning" />
                  Burn Certificates
                </CardTitle>
                <CardDescription>
                  Permanent proof of your carbon offset contributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {burnedCredits.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No certificates yet</p>
                    <p className="text-sm">Burn credits to receive permanent certificates</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {burnedCredits.map((cert) => (
                      <div 
                        key={cert.id} 
                        className="p-6 rounded-xl bg-gradient-to-r from-warning/10 to-destructive/10 border border-warning/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-warning/20">
                              <CheckCircle className="w-8 h-8 text-warning" />
                            </div>
                            <div>
                              <p className="font-display font-bold text-lg">Carbon Offset Certificate</p>
                              <p className="text-sm text-muted-foreground font-mono">{cert.certificate_number}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-success/50 text-success">
                            Verified
                          </Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Credits Retired</p>
                            <p className="font-bold">{Number(cert.amount).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CO₂ Offset</p>
                            <p className="font-bold">{(Number(cert.amount) * 0.5).toFixed(1)} tons</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-bold">{new Date(cert.burned_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OffseterDashboard;
