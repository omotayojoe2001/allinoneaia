import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Activity, DollarSign, AlertCircle } from "lucide-react";

export default function FinancialHealthScore() {
  const [score, setScore] = useState(0);
  const [metrics, setMetrics] = useState({ currentRatio: 0, profitMargin: 0, cashFlow: 0, debtToEquity: 0 });

  useEffect(() => {
    calculateHealth();
  }, []);

  const calculateHealth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: cashbook } = await supabase.from("cashbook").select("*").eq("user_id", user.id);
    if (!cashbook) return;

    const revenue = cashbook.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = cashbook.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const cashFlow = profit;

    let healthScore = 50;
    if (profitMargin > 20) healthScore += 20;
    else if (profitMargin > 10) healthScore += 10;
    if (cashFlow > 0) healthScore += 15;
    if (revenue > expenses * 1.5) healthScore += 15;

    setScore(Math.min(healthScore, 100));
    setMetrics({ currentRatio: revenue / expenses, profitMargin, cashFlow, debtToEquity: 0 });
  };

  const indicators = [
    { label: "Current Ratio", value: metrics.currentRatio.toFixed(2), icon: Activity, status: metrics.currentRatio > 1.5 ? "good" : "warning" },
    { label: "Profit Margin", value: metrics.profitMargin.toFixed(1) + "%", icon: TrendingUp, status: metrics.profitMargin > 10 ? "good" : "warning" },
    { label: "Cash Flow", value: "₦" + metrics.cashFlow.toLocaleString(), icon: DollarSign, status: metrics.cashFlow > 0 ? "good" : "critical" }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Financial Health Score</h1>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall Health Score</p>
            <p className="text-5xl font-bold">{score}/100</p>
            <p className={`text-sm ${score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
              {score >= 70 ? "Excellent" : score >= 50 ? "Good" : "Needs Improvement"}
            </p>
          </div>
          <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
            score >= 70 ? "bg-green-100" : score >= 50 ? "bg-yellow-100" : "bg-red-100"
          }`}>
            <TrendingUp className={`w-16 h-16 ${score >= 70 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600"}`} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {indicators.map(i => (
          <Card key={i.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{i.label}</p>
                <p className="text-xl font-bold">{i.value}</p>
              </div>
              <i.icon className={`w-8 h-8 ${
                i.status === "good" ? "text-green-500" : i.status === "warning" ? "text-yellow-500" : "text-red-500"
              }`} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
