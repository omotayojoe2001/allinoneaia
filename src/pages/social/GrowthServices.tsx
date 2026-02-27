import { useState, useEffect } from "react";
import { ArrowLeft, Instagram, Search, ShoppingCart, Clock, CheckCircle, AlertCircle, RefreshCw, Music, Twitter, Facebook, Youtube, Linkedin, Radio, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { kclautAPI, KClautService } from "@/lib/kclaut-api";
import { pricingManager, OrderPricing } from "@/lib/pricing-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import { KCLAUT_SERVICES } from "@/lib/kclaut-services-data";

export default function GrowthServices() {
  const { user } = useAuth();
  const { formatAmount, currency } = useCurrency();
  const { toast } = useToast();
  const [services, setServices] = useState<KClautService[]>([]);
  const [filteredServices, setFilteredServices] = useState<KClautService[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<KClautService | null>(null);
  const [orderForm, setOrderForm] = useState({ link: "", quantity: "" });
  const [pricing, setPricing] = useState<OrderPricing | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [kclautBalance, setKclautBalance] = useState({ balance: "0", currency: "NGN" });
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [activeView, setActiveView] = useState("services");

  useEffect(() => {
    loadRealServices();
    loadOrders();
    loadKClautBalance();
  }, [user]);

  useEffect(() => {
    filterServices();
  }, [services, selectedPlatform, searchTerm]);

  useEffect(() => {
    if (selectedService && orderForm.quantity) {
      calculatePricing();
    } else {
      setPricing(null);
    }
  }, [selectedService, orderForm.quantity]);

  const loadRealServices = async () => {
    setLoadingServices(true);
    try {
      // Fetch from KClaut API via proxy
      const servicesData = await kclautAPI.getServices();
      
      if (!Array.isArray(servicesData)) {
        throw new Error('Invalid response from KClaut API');
      }
      
      console.log("Loaded services from KClaut API:", servicesData.length);
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error("Failed to load services from API:", error);
      toast({ 
        title: "Error", 
        description: "Failed to load services from KClaut API", 
        variant: "destructive" 
      });
      setServices([]);
      setFilteredServices([]);
    }
    setLoadingServices(false);
  };

  const filterServices = () => {
    let filtered = services;
    
    if (selectedPlatform !== "All") {
      filtered = filtered.filter(service => service.category === selectedPlatform);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredServices(filtered);
  };

  const calculatePricing = async () => {
    if (!selectedService || !orderForm.quantity) return;
    
    try {
      const quantity = parseInt(orderForm.quantity);
      const pricingData = await pricingManager.calculatePricing(selectedService, quantity);
      setPricing(pricingData);
    } catch (error) {
      console.error("Pricing calculation failed:", error);
    }
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from("social_orders")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const loadKClautBalance = async () => {
    try {
      const balance = await pricingManager.updateKClautBalance();
      setKclautBalance(balance);
    } catch (error) {
      console.error("Failed to load KClaut balance:", error);
    }
  };

  const handlePaymentAndOrder = async () => {
    if (!selectedService || !orderForm.link || !orderForm.quantity || !pricing || !user?.email) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const quantity = parseInt(orderForm.quantity);
    if (quantity < parseInt(selectedService.min) || quantity > parseInt(selectedService.max)) {
      toast({ 
        title: "Error", 
        description: `Quantity must be between ${selectedService.min} and ${selectedService.max}`, 
        variant: "destructive" 
      });
      return;
    }

    // Store order details before closing dialog
    const orderDetails = {
      service: selectedService,
      link: orderForm.link,
      quantity,
      pricing
    };

    // Close dialog FIRST
    setShowOrderDialog(false);
    
    // Wait for dialog to fully close
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(true);
    
    try {
      const result = await pricingManager.processOrder(
        user.id,
        user.email,
        orderDetails.service,
        orderDetails.link,
        orderDetails.quantity
      );

      if (result.success) {
        toast({ title: "Success", description: "Payment successful! Order placed." });
        setOrderForm({ link: "", quantity: "" });
        setSelectedService(null);
        setPricing(null);
        loadOrders();
        loadKClautBalance();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Payment or order failed", variant: "destructive" });
    }
    setLoading(false);
  };

  const updateOrderStatus = async (order: any) => {
    try {
      const status = await kclautAPI.getOrderStatus(order.kclaut_order_id);
      await supabase
        .from("social_orders")
        .update({
          status: status.status,
          start_count: status.start_count,
          remains: status.remains
        })
        .eq("id", order.id);
      loadOrders();
      toast({ title: "Success", description: "Order status updated" });
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPlatformPlaceholder = (platform: string) => {
    switch(platform) {
      case "Instagram": return "https://instagram.com/username";
      case "Facebook": return "https://facebook.com/page-or-profile";
      case "TikTok": return "https://tiktok.com/@username";
      case "Twitter": return "https://twitter.com/username";
      case "YouTube": return "https://youtube.com/channel-or-video";
      case "LinkedIn": return "https://linkedin.com/in/profile";
      case "Telegram": return "https://t.me/channel";
      case "Spotify": return "https://open.spotify.com/artist/...";
      default: return "Enter your social media link or username";
    }
  };

  const getServiceExplanation = (serviceName: string) => {
    if (serviceName.includes("No Refill")) {
      return "⚠️ No Refill: If followers/likes drop, they won't be replaced. Lower price but no guarantee.";
    }
    if (serviceName.includes("Refill")) {
      return "✅ Refill: If followers/likes drop within 30 days, they'll be automatically replaced.";
    }
    if (serviceName.includes("Nigerian") || serviceName.includes("🇳🇬")) {
      return "🇳🇬 Targeted: Engagement from Nigerian users only. Better for local businesses.";
    }
    if (serviceName.includes("Global")) {
      return "🌍 Global: Engagement from users worldwide. Best for international reach.";
    }
    return "";
  };

  const platforms = Array.isArray(services) && services.length > 0
    ? ["All", ...Array.from(new Set(services.map(s => s.category)))].sort()
    : ["All"];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/social" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Social Media Hub
        </Link>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Growth Services</h1>
            <p className="text-muted-foreground">Professional social media growth - {services.length} services available</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Provider Balance</p>
            <p className="text-lg font-semibold">{formatAmount(parseFloat(kclautBalance.balance))}</p>
            <Button variant="ghost" size="sm" onClick={loadKClautBalance} className="mt-1">
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="mb-4 flex gap-1">
          {[
            { id: "services", label: `All Services (${filteredServices.length})` },
            { id: "orders", label: `My Orders (${orders.length})` },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 text-sm font-medium rounded transition-all flex items-center gap-1 ${
                activeView === view.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {view.label}
              {activeView === view.id && <ChevronRight className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {activeView === "services" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Platform Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {platforms.map(platform => {
                const count = platform === "All" ? services.length : services.filter(s => s.category === platform).length;
                const isActive = selectedPlatform === platform;
                
                const getPlatformIcon = (name: string) => {
                  const iconClass = "w-4 h-4";
                  switch(name) {
                    case "Instagram": return <Instagram className={iconClass} />;
                    case "TikTok": return <Music className={iconClass} />;
                    case "Twitter": return <Twitter className={iconClass} />;
                    case "Facebook": return <Facebook className={iconClass} />;
                    case "YouTube": return <Youtube className={iconClass} />;
                    case "LinkedIn": return <Linkedin className={iconClass} />;
                    case "Spotify": return <Music className={iconClass} />;
                    case "Telegram": return <Radio className={iconClass} />;
                    case "Website Traffic": return <Globe className={iconClass} />;
                    default: return <Globe className={iconClass} />;
                  }
                };
                
                return (
                  <Button
                    key={platform}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPlatform(platform)}
                    className="gap-2"
                  >
                    {platform !== "All" && getPlatformIcon(platform)}
                    {platform}
                    <Badge variant={isActive ? "secondary" : "outline"} className="ml-1">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            {/* Services Table */}
            {loadingServices ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading services from KClaut API...</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Available Services</CardTitle>
                  <CardDescription>Real-time pricing from KClaut - Showing in {currency}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium">ID</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Service</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Platform</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Rate/1000</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Min-Max</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(filteredServices) && filteredServices.map(service => {
                          const wholesaleRate = parseFloat(service.rate);
                          const markup = 0.60; // 60% profit
                          const userRate = wholesaleRate * (1 + markup);
                          
                          return (
                            <tr key={service.service} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2 text-sm text-muted-foreground">{service.service}</td>
                              <td className="py-3 px-2">
                                <div className="space-y-1">
                                  <span className="text-sm font-medium">{service.name}</span>
                                  {getServiceExplanation(service.name) && (
                                    <p className="text-xs text-muted-foreground">{getServiceExplanation(service.name)}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Badge variant="outline" className="text-xs">{service.category}</Badge>
                              </td>
                              <td className="py-3 px-2">
                                <div>
                                  <span className="font-semibold text-green-600">{formatAmount(userRate)}</span>
                                  <span className="text-xs text-muted-foreground block">Cost: {formatAmount(wholesaleRate)}</span>
                                  <span className="text-xs text-green-600 block">Profit: {formatAmount(wholesaleRate * markup)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-sm text-muted-foreground">
                                {parseInt(service.min).toLocaleString()} - {parseInt(service.max).toLocaleString()}
                              </td>
                              <td className="py-3 px-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedService(service);
                                    setOrderForm({ link: "", quantity: "" });
                                    setPricing(null);
                                    setShowOrderDialog(true);
                                  }}
                                >
                                  Order
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === "orders" && (
          <div className="space-y-6">
            {orders.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Orders</CardTitle>
                  <CardDescription>Track your social media growth orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">{order.platform}</span>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              <span className="text-xs">{order.status}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{order.service_name}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Qty: {order.quantity?.toLocaleString()}</span>
                            <span>Paid: {formatAmount(parseFloat(order.user_price || "0"))}</span>
                            <span className="text-green-600">Profit: {formatAmount(parseFloat(order.profit || "0"))}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateOrderStatus(order)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Update
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                  <p className="text-muted-foreground mb-4">Start growing your social media by placing your first order</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Order Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Place Order</DialogTitle>
              <DialogDescription className="text-xs">
                {selectedService?.name} - {selectedService?.category}
                {getServiceExplanation(selectedService?.name || "") && (
                  <span className="block mt-2 text-blue-600">{getServiceExplanation(selectedService?.name || "")}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{selectedService?.category} Link/Username</Label>
                <Input
                  placeholder={getPlatformPlaceholder(selectedService?.category || "")}
                  value={orderForm.link}
                  onChange={(e) => setOrderForm({ ...orderForm, link: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the full URL or username for your {selectedService?.category} account
                </p>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder={`Min: ${selectedService?.min}, Max: ${selectedService?.max}`}
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                />
              </div>
              
              {pricing && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span>{orderForm.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cost from Provider:</span>
                    <span>{formatAmount(pricing.wholesale_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Your Profit ({pricing.markup_percentage}%):</span>
                    <span className="font-semibold">+{formatAmount(pricing.profit)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Customer Pays:</span>
                    <span>{formatAmount(pricing.user_price)}</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handlePaymentAndOrder} 
                disabled={loading || !pricing} 
                className="w-full"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : `Place Order - ${pricing ? formatAmount(pricing.user_price) : "..."}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}