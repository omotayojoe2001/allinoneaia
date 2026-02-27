import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Brain, TrendingUp, AlertTriangle, MessageSquare, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const AIAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [queryHistory, setQueryHistory] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("query");

  useEffect(() => {
    if (user) {
      loadHealthScore();
      loadForecasts();
      loadRiskAlerts();
      loadQueryHistory();
    }
  }, [user]);

  const loadHealthScore = async () => {
    const { data } = await supabase
      .from("business_health_scores")
      .select("*")
      .eq("user_id", user?.id)
      .order("score_date", { ascending: false })
      .limit(1)
      .single();

    setHealthScore(data);
  };

  const loadForecasts = async () => {
    const { data } = await supabase
      .from("ai_predictive_forecasts")
      .select("*")
      .eq("user_id", user?.id)
      .order("generated_at", { ascending: false })
      .limit(5);

    setForecasts(data || []);
  };

  const loadRiskAlerts = async () => {
    const { data } = await supabase
      .from("ai_risk_alerts")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    setRiskAlerts(data || []);
  };

  const loadQueryHistory = async () => {
    const { data } = await supabase
      .from("ai_analytics_queries")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setQueryHistory(data || []);
  };

  const calculateBusinessHealth = async () => {
    setLoading(true);

    // Get all business data
    const [cashbook, customers, stock] = await Promise.all([
      supabase.from("cashbook_transactions").select("*").eq("user_id", user?.id),
      supabase.from("customers").select("*").eq("user_id", user?.id),
      supabase.from("stock").select("*").eq("user_id", user?.id)
    ]);

    const revenue = cashbook.data?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const expenses = cashbook.data?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const cashFlow = revenue - expenses;

    // Calculate scores
    let cashFlowScore = 0;
    if (cashFlow > 0) cashFlowScore = Math.min(100, (cashFlow / 100000) * 20);

    let revenueGrowthScore = 50; // Default
    let customerRetentionScore = customers.data ? Math.min(100, customers.data.length * 5) : 0;
    let inventoryHealthScore = stock.data ? Math.min(100, stock.data.length * 10) : 0;
    let financialStabilityScore = cashFlow > 0 ? 80 : 40;

    const overallScore = Math.round(
      (cashFlowScore * 0.3) +
      (revenueGrowthScore * 0.2) +
      (customerRetentionScore * 0.2) +
      (inventoryHealthScore * 0.15) +
      (financialStabilityScore * 0.15)
    );

    const factors = {
      positive: [],
      negative: []
    };

    if (cashFlow > 0) factors.positive.push("Positive cash flow");
    else factors.negative.push("Negative cash flow");

    if (customers.data && customers.data.length > 10) factors.positive.push("Growing customer base");
    else factors.negative.push("Limited customer base");

    const recommendations = [];
    if (cashFlow < 0) recommendations.push("Focus on increasing revenue or reducing expenses");
    if (!customers.data || customers.data.length < 5) recommendations.push("Invest in customer acquisition");
    if (!stock.data || stock.data.length < 3) recommendations.push("Expand product inventory");

    await supabase.from("business_health_scores").insert({
      user_id: user?.id,
      score_date: new Date().toISOString().split('T')[0],
      overall_score: overallScore,
      cash_flow_score: Math.round(cashFlowScore),
      revenue_growth_score: Math.round(revenueGrowthScore),
      customer_retention_score: Math.round(customerRetentionScore),
      inventory_health_score: Math.round(inventoryHealthScore),
      financial_stability_score: Math.round(financialStabilityScore),
      factors: factors,
      recommendations: recommendations
    });

    setLoading(false);
    toast({ title: "Success", description: "Business health calculated" });
    loadHealthScore();
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    const startTime = Date.now();

    // Simple query processing
    const lowerQuery = query.toLowerCase();
    let response = "";
    let queryType = "general";
    let responseData: any = {};

    if (lowerQuery.includes("revenue") || lowerQuery.includes("income")) {
      queryType = "revenue";
      const { data } = await supabase
        .from("cashbook_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "income");
      
      const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      response = `Your total revenue is ${formatAmount(total)}. You have ${data?.length || 0} income transactions.`;
      responseData = { total, count: data?.length || 0 };
    } else if (lowerQuery.includes("expense") || lowerQuery.includes("spending")) {
      queryType = "expenses";
      const { data } = await supabase
        .from("cashbook_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("type", "expense");
      
      const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      response = `Your total expenses are ${formatAmount(total)}. You have ${data?.length || 0} expense transactions.`;
      responseData = { total, count: data?.length || 0 };
    } else if (lowerQuery.includes("customer")) {
      queryType = "customers";
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user?.id);
      
      response = `You have ${data?.length || 0} customers in your database.`;
      responseData = { count: data?.length || 0 };
    } else if (lowerQuery.includes("stock") || lowerQuery.includes("inventory")) {
      queryType = "inventory";
      const { data } = await supabase
        .from("stock")
        .select("*")
        .eq("user_id", user?.id);
      
      const lowStock = data?.filter(s => s.quantity <= (s.reorder_level || 0)).length || 0;
      response = `You have ${data?.length || 0} products in stock. ${lowStock} items are low on stock.`;
      responseData = { total: data?.length || 0, lowStock };
    } else if (lowerQuery.includes("profit")) {
      queryType = "revenue";
      const { data } = await supabase
        .from("cashbook_transactions")
        .select("*")
        .eq("user_id", user?.id);
      
      const revenue = data?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      const expenses = data?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      const profit = revenue - expenses;
      response = `Your net profit is ${formatAmount(profit)}. Revenue: ${formatAmount(revenue)}, Expenses: ${formatAmount(expenses)}.`;
      responseData = { profit, revenue, expenses };
    } else {
      response = "I can help you with queries about revenue, expenses, customers, inventory, and profit. Try asking: 'What's my total revenue?' or 'How many customers do I have?'";
    }

    const executionTime = Date.now() - startTime;

    await supabase.from("ai_analytics_queries").insert({
      user_id: user?.id,
      query_text: query,
      query_type: queryType,
      response_data: responseData,
      response_summary: response,
      execution_time_ms: executionTime
    });

    setLoading(false);
    setQuery("");
    loadQueryHistory();
  };

  const dismissAlert = async (alertId: string) => {
    await supabase
      .from("ai_risk_alerts")
      .update({ status: 'dismissed' })
      .eq("id", alertId);

    loadRiskAlerts();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Conversational business intelligence</p>
        </div>

        {healthScore && (
          <div className="glass-card rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Business Health Score</h2>
              <Button onClick={calculateBusinessHealth} disabled={loading}>
                Recalculate
              </Button>
            </div>
            <div className="flex items-center gap-6 mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-secondary" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(healthScore.overall_score / 100) * 352} 352`}
                    className={
                      healthScore.overall_score >= 80 ? "text-green-500" :
                      healthScore.overall_score >= 60 ? "text-yellow-500" :
                      healthScore.overall_score >= 40 ? "text-orange-500" :
                      "text-red-500"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{healthScore.overall_score}</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cash Flow</p>
                  <p className="text-lg font-bold text-foreground">{healthScore.cash_flow_score}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue Growth</p>
                  <p className="text-lg font-bold text-foreground">{healthScore.revenue_growth_score}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer Retention</p>
                  <p className="text-lg font-bold text-foreground">{healthScore.customer_retention_score}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inventory Health</p>
                  <p className="text-lg font-bold text-foreground">{healthScore.inventory_health_score}/100</p>
                </div>
              </div>
            </div>
            {healthScore.recommendations && healthScore.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Recommendations:</p>
                {healthScore.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {riskAlerts.length > 0 && (
          <div className="glass-card rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">Risk Alerts</h2>
            </div>
            <div className="space-y-3">
              {riskAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  alert.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{alert.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-1">
          {[
            { id: "query", label: "Ask AI" },
            { id: "history", label: "Query History" },
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

        {activeView === "query" && (
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Ask About Your Business</h2>
              </div>
              <div className="flex gap-2 mb-4">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder="e.g., What's my total revenue? How many customers do I have?"
                  className="flex-1"
                />
                <Button onClick={handleQuery} disabled={loading}>
                  {loading ? "Thinking..." : "Ask"}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setQuery("What's my total revenue?")}>
                    Total revenue?
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQuery("How many customers do I have?")}>
                    Customer count?
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQuery("What's my profit?")}>
                    Profit?
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQuery("Show me my expenses")}>
                    Expenses?
                  </Button>
                </div>
              </div>
            </div>
        )}

        {activeView === "history" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Queries</h2>
              <div className="space-y-3">
                {queryHistory.map((q) => (
                  <div key={q.id} className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm font-medium text-foreground mb-1">{q.query_text}</p>
                    <p className="text-sm text-muted-foreground">{q.response_summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(q.created_at).toLocaleString()} • {q.execution_time_ms}ms
                    </p>
                  </div>
                ))}
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;
