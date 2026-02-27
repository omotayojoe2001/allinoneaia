import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, AlertCircle, Calendar, DollarSign } from "lucide-react";

const CashFlowForecast = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [currentCash, setCurrentCash] = useState(0);
  const [forecast, setForecast] = useState<any[]>([]);
  const [runway, setRunway] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadForecast();
    }
  }, [user]);

  const loadForecast = async () => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get historical data
    const { data: transactions } = await supabase
      .from("cashbook_transactions")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", threeMonthsAgo.toISOString().split('T')[0]);

    // Get pending invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user?.id)
      .eq("payment_status", "unpaid");

    if (transactions) {
      // Calculate current cash position
      const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const cash = totalIncome - totalExpense;
      setCurrentCash(cash);

      // Calculate average monthly income/expense
      const monthlyIncome = totalIncome / 3;
      const monthlyExpense = totalExpense / 3;

      // Expected income from pending invoices
      const expectedIncome = invoices?.reduce((sum, inv) => {
        const dueDate = new Date(inv.due_date);
        if (dueDate > today) {
          return sum + parseFloat(inv.total_amount);
        }
        return sum;
      }, 0) || 0;

      // Generate forecast for next 90 days
      const forecastData: any[] = [];
      const alertsList: any[] = [];
      let projectedCash = cash;
      
      for (let i = 1; i <= 90; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(forecastDate.getDate() + i);
        
        // Daily income/expense projection
        const dailyIncome = monthlyIncome / 30;
        const dailyExpense = monthlyExpense / 30;
        
        // Add expected invoice payments
        let invoiceIncome = 0;
        invoices?.forEach(inv => {
          const dueDate = new Date(inv.due_date);
          if (dueDate.toDateString() === forecastDate.toDateString()) {
            invoiceIncome += parseFloat(inv.total_amount);
          }
        });

        projectedCash = projectedCash + dailyIncome + invoiceIncome - dailyExpense;

        if (i % 10 === 0 || i === 30 || i === 60 || i === 90) {
          forecastData.push({
            day: i,
            date: forecastDate.toISOString().split('T')[0],
            cash: projectedCash,
            income: dailyIncome * i,
            expense: dailyExpense * i,
            invoiceIncome: invoiceIncome
          });
        }

        // Check for negative cash flow
        if (projectedCash < 0 && runway === 0) {
          setRunway(i);
          alertsList.push({
            message: `Cash flow projected to go negative in ${i} days`,
            severity: "critical",
            date: forecastDate.toISOString().split('T')[0]
          });
        }

        // Warning if cash drops below 20% of current
        if (projectedCash < cash * 0.2 && projectedCash > 0 && alertsList.length === 0) {
          alertsList.push({
            message: `Cash flow projected to drop by 80% in ${i} days`,
            severity: "warning",
            date: forecastDate.toISOString().split('T')[0]
          });
        }
      }

      setForecast(forecastData);
      setAlerts(alertsList);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Cash Flow Forecast
          </h1>
          <p className="text-sm text-muted-foreground">90-day cash flow projection based on historical data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Current Cash</p>
            </div>
            <p className={`text-2xl font-bold ${currentCash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatAmount(currentCash)}
            </p>
          </div>

          {forecast.length > 0 && (
            <>
              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">30 Days</p>
                </div>
                <p className={`text-2xl font-bold ${forecast[2]?.cash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatAmount(forecast[2]?.cash || 0)}
                </p>
              </div>

              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">60 Days</p>
                </div>
                <p className={`text-2xl font-bold ${forecast[5]?.cash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatAmount(forecast[5]?.cash || 0)}
                </p>
              </div>

              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">90 Days</p>
                </div>
                <p className={`text-2xl font-bold ${forecast[8]?.cash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatAmount(forecast[8]?.cash || 0)}
                </p>
              </div>
            </>
          )}
        </div>

        {runway > 0 && (
          <div className="glass-card rounded-lg p-6 mb-6 bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-500">Critical: Cash Runway Alert</p>
                <p className="text-sm text-foreground mt-1">
                  Your cash is projected to run out in <span className="font-bold">{runway} days</span>. 
                  Consider reducing expenses or increasing revenue immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {alerts.length > 0 && runway === 0 && (
          <div className="glass-card rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">Cash Flow Warnings</h2>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <p className="font-medium text-foreground">{alert.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">Date: {alert.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Cash Flow Timeline</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Day</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Projected Cash</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((f, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 text-sm text-foreground">Day {f.day}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{f.date}</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${f.cash >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatAmount(f.cash)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        f.cash >= currentCash * 0.8 ? 'bg-green-500/15 text-green-500' :
                        f.cash >= 0 ? 'bg-yellow-500/15 text-yellow-500' :
                        'bg-red-500/15 text-red-500'
                      }`}>
                        {f.cash >= currentCash * 0.8 ? 'HEALTHY' : f.cash >= 0 ? 'WARNING' : 'CRITICAL'}
                      </span>
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

export default CashFlowForecast;
