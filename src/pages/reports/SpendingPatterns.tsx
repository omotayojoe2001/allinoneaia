import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SpendingPatterns = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>({});

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (user && startDate && endDate) {
      analyzeSpending();
    }
  }, [user, startDate, endDate]);

  const analyzeSpending = async () => {
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - daysDiff);
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);

    // Current period
    const { data: current } = await supabase
      .from("cashbook_transactions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate);

    // Previous period
    const { data: previous } = await supabase
      .from("cashbook_transactions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .gte("date", prevStart.toISOString().split('T')[0])
      .lte("date", prevEnd.toISOString().split('T')[0]);

    if (current && previous) {
      // Category analysis
      const currentByCategory: any = {};
      const previousByCategory: any = {};

      current.forEach(t => {
        const cat = t.category || "Uncategorized";
        currentByCategory[cat] = (currentByCategory[cat] || 0) + parseFloat(t.amount);
      });

      previous.forEach(t => {
        const cat = t.category || "Uncategorized";
        previousByCategory[cat] = (previousByCategory[cat] || 0) + parseFloat(t.amount);
      });

      // Calculate changes
      const alertsList: any[] = [];
      const trendsList: any[] = [];

      Object.keys(currentByCategory).forEach(cat => {
        const currentAmount = currentByCategory[cat];
        const previousAmount = previousByCategory[cat] || 0;
        const change = previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 100;
        const diff = currentAmount - previousAmount;

        trendsList.push({
          category: cat,
          current: currentAmount,
          previous: previousAmount,
          change: change,
          diff: diff
        });

        if (change > 20) {
          alertsList.push({
            category: cat,
            message: `${cat} spending increased by ${change.toFixed(1)}%`,
            severity: change > 50 ? "high" : "medium",
            amount: currentAmount,
            change: change
          });
        }
      });

      // Total comparison
      const totalCurrent = current.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalPrevious = previous.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalChange = totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;

      setComparison({
        current: totalCurrent,
        previous: totalPrevious,
        change: totalChange,
        diff: totalCurrent - totalPrevious
      });

      setAlerts(alertsList.sort((a, b) => b.change - a.change));
      setTrends(trendsList.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Spending Pattern Analysis
          </h1>
          <p className="text-sm text-muted-foreground">Detect unusual spending patterns and trends</p>
        </div>

        <div className="glass-card rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Current Period</p>
            <p className="text-2xl font-bold text-foreground">{formatAmount(comparison.current || 0)}</p>
          </div>
          <div className="glass-card rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Previous Period</p>
            <p className="text-2xl font-bold text-foreground">{formatAmount(comparison.previous || 0)}</p>
          </div>
          <div className="glass-card rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Change</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${comparison.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {comparison.change >= 0 ? '+' : ''}{comparison.change?.toFixed(1)}%
              </p>
              {comparison.change >= 0 ? <TrendingUp className="w-5 h-5 text-red-500" /> : <TrendingDown className="w-5 h-5 text-green-500" />}
            </div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="glass-card rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">Spending Alerts</h2>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-lg border ${
                  alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{alert.message}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Current spending: {formatAmount(alert.amount)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Category Trends</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Current</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Previous</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Change</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Difference</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((trend, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 text-sm text-foreground">{trend.category}</td>
                    <td className="py-3 px-4 text-sm text-right text-foreground">{formatAmount(trend.current)}</td>
                    <td className="py-3 px-4 text-sm text-right text-muted-foreground">{formatAmount(trend.previous)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`flex items-center justify-end gap-1 ${trend.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(1)}%
                        {trend.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${trend.diff >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {trend.diff >= 0 ? '+' : ''}{formatAmount(trend.diff)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingPatterns;
