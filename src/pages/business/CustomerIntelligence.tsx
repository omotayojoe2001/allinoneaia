import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Users, TrendingUp, AlertCircle, Star, Mail, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CustomerIntelligence = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [activeView, setActiveView] = useState("top");
  const [segments, setSegments] = useState({
    highValue: 0,
    active: 0,
    dormant: 0,
    atRisk: 0,
    lost: 0
  });
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    const { data } = await supabase
      .from("customer_analytics_cache")
      .select("*")
      .eq("user_id", user?.id)
      .order("lifetime_value", { ascending: false });

    if (data) {
      setAnalytics(data);
      
      // Calculate segments
      const highValue = data.filter(c => c.customer_grade === 'A').length;
      const active = data.filter(c => c.status === 'active').length;
      const dormant = data.filter(c => c.status === 'dormant').length;
      const atRisk = data.filter(c => c.status === 'at_risk').length;
      const lost = data.filter(c => c.status === 'lost').length;
      
      setSegments({ highValue, active, dormant, atRisk, lost });
      setTopCustomers(data.slice(0, 10));
    }
  };

  const calculateCustomerMetrics = async () => {
    // Get all customers
    const { data: customers } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user?.id);

    if (!customers) return;

    // For each customer, calculate metrics from cashbook
    for (const customer of customers) {
      const { data: transactions } = await supabase
        .from("cashbook_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "income")
        .ilike("description", `%${customer.name}%`);

      if (transactions && transactions.length > 0) {
        const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalOrders = transactions.length;
        const avgOrderValue = totalRevenue / totalOrders;
        
        const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
        const firstPurchase = dates[0];
        const lastPurchase = dates[dates.length - 1];
        const daysSinceLast = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate purchase frequency
        let frequency = 0;
        if (dates.length > 1) {
          const totalDays = (lastPurchase.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24);
          frequency = totalDays / (dates.length - 1);
        }

        // Determine status
        let status = 'active';
        if (daysSinceLast > 90) status = 'lost';
        else if (daysSinceLast > 60) status = 'at_risk';
        else if (daysSinceLast > 30) status = 'dormant';

        // Calculate grade based on LTV
        let grade = 'D';
        if (totalRevenue > 1000000) grade = 'A';
        else if (totalRevenue > 500000) grade = 'B';
        else if (totalRevenue > 100000) grade = 'C';

        // Calculate lead score (0-100)
        let score = 0;
        score += Math.min(30, (totalRevenue / 10000)); // Revenue contribution
        score += Math.min(20, totalOrders * 2); // Order frequency
        score += Math.min(20, (90 - daysSinceLast) / 4.5); // Recency
        score += Math.min(30, (365 / (frequency || 365)) * 3); // Purchase frequency

        // Upsert analytics
        await supabase.from("customer_analytics_cache").upsert({
          user_id: user?.id,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          average_order_value: avgOrderValue,
          first_purchase_date: firstPurchase.toISOString().split('T')[0],
          last_purchase_date: lastPurchase.toISOString().split('T')[0],
          days_since_last_purchase: daysSinceLast,
          purchase_frequency: frequency,
          lifetime_value: totalRevenue,
          customer_grade: grade,
          lead_score: Math.round(score),
          status: status,
          last_calculated_at: new Date().toISOString()
        }, { onConflict: 'customer_id,user_id' });
      }
    }

    loadAnalytics();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Customer Intelligence
            </h1>
            <p className="text-sm text-muted-foreground">Lifetime value, segmentation & engagement</p>
          </div>
          <Button onClick={calculateCustomerMetrics}>
            Calculate Metrics
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <p className="text-xs text-muted-foreground">High Value (A)</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{segments.highValue}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Active</p>
            <p className="text-2xl font-bold text-green-500">{segments.active}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Dormant</p>
            <p className="text-2xl font-bold text-yellow-500">{segments.dormant}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">At Risk</p>
            <p className="text-2xl font-bold text-orange-500">{segments.atRisk}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Lost</p>
            <p className="text-2xl font-bold text-red-500">{segments.lost}</p>
          </div>
        </div>

        <div className="mb-4 flex gap-1">
          {[
            { id: "top", label: "Top Customers" },
            { id: "dormant", label: "Dormant" },
            { id: "atrisk", label: "At Risk" },
            { id: "all", label: "All Customers" },
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

        {activeView === "top" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Top 10 Customers by Lifetime Value</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Customer</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Grade</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">LTV</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Orders</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Avg Order</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c) => (
                      <tr key={c.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{c.customer_name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            c.customer_grade === 'A' ? 'bg-yellow-500/15 text-yellow-500' :
                            c.customer_grade === 'B' ? 'bg-blue-500/15 text-blue-500' :
                            c.customer_grade === 'C' ? 'bg-green-500/15 text-green-500' :
                            'bg-gray-500/15 text-gray-500'
                          }`}>
                            {c.customer_grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-bold text-primary">{formatAmount(c.lifetime_value)}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{c.total_orders}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(c.average_order_value)}</td>
                        <td className="py-3 px-4 text-sm text-right text-muted-foreground">{c.days_since_last_purchase}d ago</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {activeView === "dormant" && (
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Dormant Customers (30-60 days)</h2>
                <Button size="sm" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Re-engagement
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Customer</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">LTV</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Last Purchase</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.filter(c => c.status === 'dormant').map((c) => (
                      <tr key={c.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{c.customer_name}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(c.lifetime_value)}</td>
                        <td className="py-3 px-4 text-sm text-right text-yellow-500">{c.days_since_last_purchase}d ago</td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm" variant="ghost">Contact</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {activeView === "atrisk" && (
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-foreground">At Risk Customers (60-90 days)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Customer</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">LTV</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Last Purchase</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.filter(c => c.status === 'at_risk').map((c) => (
                      <tr key={c.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{c.customer_name}</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(c.lifetime_value)}</td>
                        <td className="py-3 px-4 text-sm text-right text-orange-500">{c.days_since_last_purchase}d ago</td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm" variant="ghost">Win Back</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {activeView === "all" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">All Customers</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Customer</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Grade</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Score</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-foreground">LTV</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((c) => (
                      <tr key={c.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{c.customer_name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            c.customer_grade === 'A' ? 'bg-yellow-500/15 text-yellow-500' :
                            c.customer_grade === 'B' ? 'bg-blue-500/15 text-blue-500' :
                            c.customer_grade === 'C' ? 'bg-green-500/15 text-green-500' :
                            'bg-gray-500/15 text-gray-500'
                          }`}>
                            {c.customer_grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-foreground">{c.lead_score}/100</td>
                        <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(c.lifetime_value)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            c.status === 'active' ? 'bg-green-500/15 text-green-500' :
                            c.status === 'dormant' ? 'bg-yellow-500/15 text-yellow-500' :
                            c.status === 'at_risk' ? 'bg-orange-500/15 text-orange-500' :
                            'bg-red-500/15 text-red-500'
                          }`}>
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CustomerIntelligence;
