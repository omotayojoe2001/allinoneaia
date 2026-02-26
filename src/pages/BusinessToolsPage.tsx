import { useState, useEffect } from "react";
import { Briefcase, Table, Users, Wallet, FileText, TrendingUp, CreditCard, BookOpen, DollarSign, Bell, Package, Calendar, CheckSquare, Plus, ShoppingCart, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageAIAgent } from "@/components/PageAIAgent";
import { pageAgentConfigs } from "@/lib/page-agent-configs";

const tools = [
  { name: "Cashbook", desc: "Income & expense tracking", icon: Wallet, link: "/business/cashbook", color: "hsl(var(--module-business))" },
  { name: "Invoice Generator", desc: "Create & send PDF invoices", icon: FileText, link: "/business/invoices", color: "hsl(var(--module-business))" },
  { name: "Bookkeeping", desc: "Financial records & reports", icon: BookOpen, link: "/business/bookkeeping", color: "hsl(var(--module-business))" },
  { name: "Staff Management", desc: "Employee database", icon: Users, link: "/business/staff", color: "hsl(var(--module-business))" },
  { name: "Attendance", desc: "Track staff attendance", icon: CheckSquare, link: "/business/attendance", color: "hsl(var(--module-business))" },
  { name: "Salary Management", desc: "Manage staff salaries", icon: DollarSign, link: "/business/salary", color: "hsl(var(--module-business))" },
  { name: "Smart Reports", desc: "AI-powered data analysis", icon: Table, link: "/business/reports", color: "hsl(var(--module-business))" },
];

const BusinessToolsPage = () => {
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
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "all">("week");
  const [showActivities, setShowActivities] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentActivities();
    }
  }, [user, dateFilter]);

  const fetchStats = async () => {
    const now = new Date();
    let startDate = new Date();
    
    if (dateFilter === "today") startDate.setHours(0, 0, 0, 0);
    else if (dateFilter === "week") startDate.setDate(now.getDate() - 7);
    else if (dateFilter === "month") startDate.setMonth(now.getMonth() - 1);
    else startDate = new Date(0);

    const dateQuery = dateFilter === "all" ? "" : startDate.toISOString().split('T')[0];

    const [cashbook, invoices, customers, stock, appointments, tasks] = await Promise.all([
      dateFilter === "all" 
        ? supabase.from("cashbook_transactions").select("*").eq("user_id", user?.id)
        : supabase.from("cashbook_transactions").select("*").eq("user_id", user?.id).gte("date", dateQuery),
      supabase.from("invoices").select("*").eq("user_id", user?.id),
      supabase.from("customers").select("*").eq("user_id", user?.id),
      supabase.from("stock").select("*").eq("user_id", user?.id),
      supabase.from("appointments").select("*").eq("user_id", user?.id).eq("status", "scheduled"),
      supabase.from("tasks").select("*").eq("user_id", user?.id).eq("status", "pending")
    ]);

    const cashbookIncome = cashbook.data?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const cashbookExpense = cashbook.data?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    setStats({
      totalRevenue: cashbookIncome,
      totalExpense: cashbookExpense,
      totalInvoices: invoices.data?.length || 0,
      totalCustomers: customers.data?.length || 0,
      totalStock: stock.data?.length || 0,
      pendingAppointments: appointments.data?.length || 0,
      pendingTasks: tasks.data?.length || 0
    });
  };

  const fetchRecentActivities = async () => {
    const { data: cashbook } = await supabase
      .from("cashbook_transactions")
      .select("*")
      .eq("user_id", user?.id)
      .order("date", { ascending: false })
      .limit(3);

    setRecentActivities(cashbook || []);
  };

  const statCards = [
    { label: "Total Revenue", value: formatAmount(stats.totalRevenue), icon: DollarSign, color: "text-green-500" },
    { label: "Total Expense", value: formatAmount(stats.totalExpense), icon: TrendingUp, color: "text-red-500" },
    { label: "Net Balance", value: formatAmount(stats.totalRevenue - stats.totalExpense), icon: Wallet, color: "text-blue-500" },
    { label: "Customers", value: stats.totalCustomers, icon: Users, color: "text-purple-500" },
    { label: "Invoices", value: stats.totalInvoices, icon: FileText, color: "text-orange-500" },
    { label: "Stock Items", value: stats.totalStock, icon: Package, color: "text-cyan-500" },
    { label: "Appointments", value: stats.pendingAppointments, icon: Calendar, color: "text-pink-500" },
    { label: "Pending Tasks", value: stats.pendingTasks, icon: CheckSquare, color: "text-indigo-500" },
  ];

  return (
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <PageAIAgent {...pageAgentConfigs.business} />
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
            <Briefcase className="w-5 h-5" style={{ color: "hsl(var(--module-business))" }} /> Business Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Overview of your business operations</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowActivities(!showActivities)}>
            {showActivities ? "Hide" : "Show"} Activities
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Two Column Layout: Activities + Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities - Takes 1 column */}
        {showActivities && (
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <p className={`text-sm font-semibold ml-2 ${activity.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {activity.type === "income" ? "+" : "-"}{formatAmount(parseFloat(activity.amount))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
              )}
            </div>
          </div>
        )}

        {/* Business Tools - Takes 2 columns */}
        <div className={showActivities ? "lg:col-span-2" : "lg:col-span-3"}>
          <h2 className="text-lg font-semibold mb-4">Business Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((t) => (
              <Link key={t.name} to={t.link} className="glass-card rounded-lg p-5 cursor-pointer hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "hsl(var(--module-business) / 0.12)" }}>
                  <t.icon className="w-5 h-5" style={{ color: t.color }} />
                </div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default BusinessToolsPage;
