import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Package, TrendingUp, TrendingDown, AlertTriangle, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const InventoryIntelligence = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [worstSellers, setWorstSellers] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
      loadValuation();
    }
  }, [user]);

  const loadAnalytics = async () => {
    const { data } = await supabase
      .from("inventory_analytics_cache")
      .select("*")
      .eq("user_id", user?.id)
      .order("best_seller_rank", { ascending: true });

    if (data) {
      setAnalytics(data);
      setCriticalStock(data.filter(p => p.stock_status === 'critical' || p.stock_status === 'low'));
      setBestSellers(data.filter(p => p.best_seller_rank <= 10));
      setWorstSellers(data.filter(p => p.last_90_days_sold === 0));
    }
  };

  const loadValuation = async () => {
    const { data } = await supabase
      .from("stock_valuation_snapshots")
      .select("*")
      .eq("user_id", user?.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .single();

    if (data) setValuation(data);
  };

  const calculateInventoryMetrics = async () => {
    const { data: stock } = await supabase
      .from("stock")
      .select("*")
      .eq("user_id", user?.id);

    if (!stock) return;

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of stock) {
      // Get sales from cashbook (assuming product name in description)
      const { data: sales } = await supabase
        .from("cashbook_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "income")
        .ilike("description", `%${product.name}%`);

      const sales30 = sales?.filter(s => new Date(s.date) >= thirtyDaysAgo).length || 0;
      const sales60 = sales?.filter(s => new Date(s.date) >= sixtyDaysAgo).length || 0;
      const sales90 = sales?.filter(s => new Date(s.date) >= ninetyDaysAgo).length || 0;

      const revenue30 = sales?.filter(s => new Date(s.date) >= thirtyDaysAgo)
        .reduce((sum, s) => sum + parseFloat(s.amount), 0) || 0;

      const velocity = sales30 / 30; // units per day
      const daysUntilStockout = velocity > 0 ? Math.floor(product.quantity / velocity) : 999;

      let status = 'healthy';
      if (product.quantity === 0) {
        status = 'out_of_stock';
        outOfStockCount++;
      } else if (product.quantity <= (product.reorder_level || 0)) {
        status = 'critical';
        lowStockCount++;
      } else if (daysUntilStockout <= 7) {
        status = 'low';
      }

      const value = product.quantity * (product.price || 0);
      totalValue += value;

      await supabase.from("inventory_analytics_cache").upsert({
        user_id: user?.id,
        product_id: product.id,
        product_name: product.name,
        current_stock: product.quantity,
        reorder_level: product.reorder_level || 0,
        sales_velocity: velocity,
        days_until_stockout: daysUntilStockout,
        last_30_days_sold: sales30,
        last_60_days_sold: sales60,
        last_90_days_sold: sales90,
        revenue_last_30_days: revenue30,
        stock_status: status,
        last_calculated_at: new Date().toISOString()
      }, { onConflict: 'product_id,user_id' });
    }

    // Rank best sellers
    const { data: ranked } = await supabase
      .from("inventory_analytics_cache")
      .select("*")
      .eq("user_id", user?.id)
      .order("last_30_days_sold", { ascending: false });

    if (ranked) {
      for (let i = 0; i < ranked.length; i++) {
        await supabase
          .from("inventory_analytics_cache")
          .update({ best_seller_rank: i + 1 })
          .eq("id", ranked[i].id);
      }
    }

    // Save valuation snapshot
    await supabase.from("stock_valuation_snapshots").insert({
      user_id: user?.id,
      snapshot_date: today.toISOString().split('T')[0],
      total_stock_value: totalValue,
      total_items: stock.length,
      low_stock_items: lowStockCount,
      out_of_stock_items: outOfStockCount
    });

    toast({ title: "Success", description: "Inventory metrics calculated" });
    loadAnalytics();
    loadValuation();
  };

  const generatePurchaseOrder = async (product: any) => {
    const poNumber = `PO-${Date.now()}`;
    const quantity = Math.max(product.reorder_level * 2, 10);
    const unitCost = product.price * 0.6; // Assume 40% margin
    const total = quantity * unitCost;

    await supabase.from("purchase_orders_auto").insert({
      user_id: user?.id,
      po_number: poNumber,
      supplier_name: "Default Supplier",
      status: "draft",
      total_amount: total,
      items: [{
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: quantity,
        unit_cost: unitCost,
        total: total
      }],
      order_date: new Date().toISOString().split('T')[0]
    });

    toast({ title: "Success", description: `Purchase order ${poNumber} created` });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Inventory Intelligence
            </h1>
            <p className="text-sm text-muted-foreground">Predictive stock alerts & sales analytics</p>
          </div>
          <Button onClick={calculateInventoryMetrics}>
            Calculate Metrics
          </Button>
        </div>

        {valuation && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Stock Value</p>
              <p className="text-2xl font-bold text-primary">{formatAmount(valuation.total_stock_value)}</p>
            </div>
            <div className="glass-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{valuation.total_items}</p>
            </div>
            <div className="glass-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-orange-500">{valuation.low_stock_items}</p>
            </div>
            <div className="glass-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-red-500">{valuation.out_of_stock_items}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="critical">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="critical">Critical Stock</TabsTrigger>
            <TabsTrigger value="bestsellers">Best Sellers</TabsTrigger>
            <TabsTrigger value="worst">Dead Stock</TabsTrigger>
            <TabsTrigger value="all">All Products</TabsTrigger>
          </TabsList>

          <TabsContent value="critical">
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-foreground">Critical & Low Stock Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Current Stock</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Velocity</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Days Left</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalStock.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{p.product_name}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{p.current_stock}</td>
                        <td className="py-3 px-4 text-sm text-right text-muted-foreground">{p.sales_velocity?.toFixed(1)}/day</td>
                        <td className="py-3 px-4 text-sm text-right text-orange-500">{p.days_until_stockout}d</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            p.stock_status === 'critical' ? 'bg-red-500/15 text-red-500' : 'bg-orange-500/15 text-orange-500'
                          }`}>
                            {p.stock_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm" variant="outline" onClick={() => generatePurchaseOrder(p)}>
                            <FileText className="w-4 h-4 mr-1" />
                            Create PO
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bestsellers">
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">Top 10 Best Sellers (Last 30 Days)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Units Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellers.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm font-bold text-primary">#{p.best_seller_rank}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{p.product_name}</td>
                        <td className="py-3 px-4 text-sm text-right text-green-500">{p.last_30_days_sold}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(p.revenue_last_30_days)}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{p.current_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="worst">
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-foreground">Dead Stock (No Sales in 90 Days)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Current Stock</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Stock Value</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {worstSellers.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{p.product_name}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{p.current_stock}</td>
                        <td className="py-3 px-4 text-sm text-right text-red-500">{formatAmount(p.current_stock * 100)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-500">
                            DISCOUNT/REMOVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">All Products</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Product</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Stock</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">30d Sales</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Velocity</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{p.product_name}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{p.current_stock}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{p.last_30_days_sold}</td>
                        <td className="py-3 px-4 text-sm text-right text-muted-foreground">{p.sales_velocity?.toFixed(2)}/day</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            p.stock_status === 'healthy' ? 'bg-green-500/15 text-green-500' :
                            p.stock_status === 'low' ? 'bg-yellow-500/15 text-yellow-500' :
                            p.stock_status === 'critical' ? 'bg-orange-500/15 text-orange-500' :
                            'bg-red-500/15 text-red-500'
                          }`}>
                            {p.stock_status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InventoryIntelligence;
