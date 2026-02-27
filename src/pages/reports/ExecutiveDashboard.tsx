import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Briefcase } from "lucide-react";

export default function ExecutiveDashboard() {
  const [kpis, setKpis] = useState({ revenue: 0, expenses: 0, profit: 0, customers: 0, orders: 0, margin: 0 });
  const [trends, setTrends] = useState({ revenue: 0, expenses: 0, profit: 0 });

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const { data: currentCashbook } = await supabase.from("cashbook").select("*").eq("user_id", user.id).gte("date", startOfMonth.toISOString());
    const { data: lastCashbook } = await supabase.from("cashbook").select("*").eq("user_id", user.id).gte("date", startOfLastMonth.toISOString()).lte("date", endOfLastMonth.toISOString());

    const currentRevenue = currentCashbook?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const currentExpenses = currentCashbook?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const lastRevenue = lastCashbook?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const lastExpenses = lastCashbook?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    const { data: customers } = await supabase.from("customers").select("id").eq("user_id", user.id);
    const { data: invoices } = await supabase.from("invoices").select("id").eq("user_id", user.id).gte("created_at", startOfMonth.toISOString());

    const profit = currentRevenue - currentExpenses;
    const lastProfit = lastRevenue - lastExpenses;

    setKpis({
      revenue: currentRevenue,
      expenses: currentExpenses,
      profit,
      customers: customers?.length || 0,
      orders: invoices?.length || 0,
      margin: currentRevenue > 0 ? (profit / currentRevenue) * 100 : 0
    });

    setTrends({
      revenue: lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0,
      expenses: lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0,
      profit: lastProfit > 0 ? ((profit - lastProfit) / lastProfit) * 100 : 0
    });
  };

  const metrics = [
    { label: "Revenue", value: kpis.revenue, trend: trends.revenue, icon: DollarSign, color: "text-green-500" },
    { label: "Expenses", value: kpis.expenses, trend: trends.expenses, icon: TrendingDown, color: "text-red-500" },
    { label: "Profit", value: kpis.profit, trend: trends.profit, icon: TrendingUp, color: "text-blue-500" },
    { label: "Customers", value: kpis.customers, icon: Users, color: "text-purple-500" },
    { label: "Orders", value: kpis.orders, icon: Package, color: "text-orange-500" },
    { label: "Margin", value: kpis.margin.toFixed(1) + "%", icon: Briefcase, color: "text-indigo-500" }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Executive Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map(m => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold">
                  {typeof m.value === "number" && m.label !== "Margin" ? `₦${m.value.toLocaleString()}` : m.value}
                </p>
                {m.trend !== undefined && (
                  <p className={`text-sm ${m.trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {m.trend >= 0 ? "+" : ""}{m.trend.toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <m.icon className={`w-8 h-8 ${m.color}`} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
