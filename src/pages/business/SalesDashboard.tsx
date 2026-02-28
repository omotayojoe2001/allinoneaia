import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const SalesDashboard = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpense: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalStock: 0,
    pendingAppointments: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    if (user) fetchAllStats();
  }, [user]);

  const fetchAllStats = async () => {
    const [cashbook, invoices, customers, stock, appointments, tasks] = await Promise.all([
      supabase.from("cashbook_transactions").select("*").eq("user_id", user?.id),
      supabase.from("invoices").select("*").eq("user_id", user?.id),
      supabase.from("customers").select("*").eq("user_id", user?.id),
      supabase.from("stock").select("*").eq("user_id", user?.id),
      supabase.from("appointments").select("*").eq("user_id", user?.id).eq("status", "scheduled"),
      supabase.from("tasks").select("*").eq("user_id", user?.id).eq("status", "pending")
    ]);

    const cashbookIncome = cashbook.data?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const cashbookExpense = cashbook.data?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const invoiceRevenue = invoices.data?.reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;

    setStats({
      totalRevenue: cashbookIncome + invoiceRevenue,
      totalExpense: cashbookExpense,
      totalInvoices: invoices.data?.length || 0,
      totalCustomers: customers.data?.length || 0,
      totalStock: stock.data?.length || 0,
      pendingAppointments: appointments.data?.length || 0,
      pendingTasks: tasks.data?.length || 0
    });
  };

  const statCards = [
    { label: "Total Revenue", value: formatAmount(stats.totalRevenue), icon: DollarSign, color: "text-green-500" },
    { label: "Total Expense", value: formatAmount(stats.totalExpense), icon: TrendingUp, color: "text-red-500" },
    { label: "Net Balance", value: formatAmount(stats.totalRevenue - stats.totalExpense), icon: ShoppingCart, color: "text-blue-500" },
    { label: "Customers", value: stats.totalCustomers, icon: Users, color: "text-purple-500" },
    { label: "Invoices", value: stats.totalInvoices, icon: ShoppingCart, color: "text-orange-500" },
    { label: "Stock Items", value: stats.totalStock, icon: Package, color: "text-cyan-500" },
    { label: "Appointments", value: stats.pendingAppointments, icon: Calendar, color: "text-pink-500" },
    { label: "Pending Tasks", value: stats.pendingTasks, icon: CheckSquare, color: "text-indigo-500" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="w-full">
        <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Business Tools
        </Link>

        <h1 className="text-2xl font-bold mb-6">Business Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/business/cashbook" className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 text-center">
              <p className="text-sm font-medium">Cashbook</p>
            </Link>
            <Link to="/business/invoices" className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 text-center">
              <p className="text-sm font-medium">Invoices</p>
            </Link>
            <Link to="/business/customers" className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 text-center">
              <p className="text-sm font-medium">Customers</p>
            </Link>
            <Link to="/business/stock" className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 text-center">
              <p className="text-sm font-medium">Stock</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
