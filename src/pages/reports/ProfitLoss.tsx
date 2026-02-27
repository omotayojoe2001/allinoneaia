import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ProfitLoss = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (user && startDate && endDate) {
      loadData();
    }
  }, [user, startDate, endDate]);

  const loadData = async () => {
    const { data } = await supabase
      .from("cashbook_transactions")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (data) {
      const totalRevenue = data.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpenses = data.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setRevenue(totalRevenue);
      setExpenses(totalExpenses);

      // Monthly breakdown
      const monthly: any = {};
      data.forEach(t => {
        const month = t.date.substring(0, 7);
        if (!monthly[month]) monthly[month] = { revenue: 0, expenses: 0 };
        if (t.type === "income") monthly[month].revenue += parseFloat(t.amount);
        else monthly[month].expenses += parseFloat(t.amount);
      });
      const monthlyArray = Object.keys(monthly).map(month => ({
        month,
        revenue: monthly[month].revenue,
        expenses: monthly[month].expenses,
        profit: monthly[month].revenue - monthly[month].expenses
      }));
      setMonthlyData(monthlyArray);

      // Category breakdown
      const categories: any = {};
      data.filter(t => t.type === "expense").forEach(t => {
        const cat = t.category || "Uncategorized";
        categories[cat] = (categories[cat] || 0) + parseFloat(t.amount);
      });
      const categoryArray = Object.keys(categories).map(cat => ({ category: cat, amount: categories[cat] }));
      setCategoryData(categoryArray);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Profit & Loss Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);

    doc.text(`Total Revenue: ${formatAmount(revenue)}`, 14, 40);
    doc.text(`Total Expenses: ${formatAmount(expenses)}`, 14, 47);
    doc.text(`Net Profit/Loss: ${formatAmount(revenue - expenses)}`, 14, 54);

    autoTable(doc, {
      startY: 65,
      head: [["Month", "Revenue", "Expenses", "Profit/Loss"]],
      body: monthlyData.map(m => [m.month, formatAmount(m.revenue), formatAmount(m.expenses), formatAmount(m.profit)])
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Category", "Amount"]],
      body: categoryData.map(c => [c.category, formatAmount(c.amount)])
    });

    doc.save("profit-loss-report.pdf");
  };

  const profit = revenue - expenses;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Profit & Loss Report
            </h1>
            <p className="text-sm text-muted-foreground">Financial performance summary</p>
          </div>
          <Button onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="glass-card rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Date Range</h2>
          </div>
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
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-green-500">{formatAmount(revenue)}</p>
          </div>
          <div className="glass-card rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">{formatAmount(expenses)}</p>
          </div>
          <div className="glass-card rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Net Profit/Loss</p>
            <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatAmount(profit)}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Month</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Expenses</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 text-sm text-foreground">{m.month}</td>
                    <td className="py-3 px-4 text-sm text-right text-green-500">{formatAmount(m.revenue)}</td>
                    <td className="py-3 px-4 text-sm text-right text-red-500">{formatAmount(m.expenses)}</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${m.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatAmount(m.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Expenses by Category</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((c, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 px-4 text-sm text-foreground">{c.category}</td>
                    <td className="py-3 px-4 text-sm text-right text-red-500">{formatAmount(c.amount)}</td>
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

export default ProfitLoss;
