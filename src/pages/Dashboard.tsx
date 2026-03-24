import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "react-router-dom";
import { QuickCheckIn } from "@/components/QuickCheckIn";
import AIBriefingCard from "@/components/AIBriefingCard";
import { DollarSign, TrendingUp, TrendingDown, Users, Package, FileText, AlertCircle, CheckCircle, Clock, Zap, Target, ArrowUpRight, Mail, Phone, Calendar, Briefcase, ShoppingCart, CreditCard, Bell } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [stats, setStats] = useState<any>({});
  const [trends, setTrends] = useState<any>({});
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [userName, setUserName] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
      const interval = setInterval(loadDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    setUserName(profile?.full_name || user.email?.split('@')[0] || 'User');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [cashbook, lastMonthCashbook, invoices, customers, stock, tasks, appointments, emailAnalytics, segments, proposals] = await Promise.all([
      supabase.from('cashbook_transactions').select('*').eq('user_id', user.id).gte('date', startOfMonth.toISOString()),
      supabase.from('cashbook_transactions').select('*').eq('user_id', user.id).gte('date', lastMonth.toISOString()).lte('date', endOfLastMonth.toISOString()),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('customers').select('*').eq('user_id', user.id),
      supabase.from('stock').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('appointments').select('*').eq('user_id', user.id).gte('date', now.toISOString()),
      supabase.from('email_analytics').select('*').eq('user_id', user.id),
      supabase.from('customer_segments').select('*').eq('user_id', user.id),
      supabase.from('proposals').select('*').eq('user_id', user.id)
    ]);

    const revenue = cashbook.data?.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
    const expense = cashbook.data?.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
    const lastRevenue = lastMonthCashbook.data?.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;
    const lastExpense = lastMonthCashbook.data?.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0) || 0;

    const profit = revenue - expense;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const revenueTrend = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0;
    const expenseTrend = lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : 0;

    const pendingInvoices = invoices.data?.filter(i => i.payment_status === 'unpaid') || [];
    const overdueInvoices = pendingInvoices.filter(i => new Date(i.due_date) < now);
    const paidInvoices = invoices.data?.filter(i => i.payment_status === 'paid') || [];
    const collectionRate = invoices.data?.length ? (paidInvoices.length / invoices.data.length) * 100 : 0;

    const lowStock = stock.data?.filter(s => s.quantity <= (s.reorder_level || 0)) || [];
    const totalStock = stock.data?.reduce((s, i) => s + (i.quantity * i.unit_price), 0) || 0;

    const completedTasks = tasks.data?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = tasks.data?.length || 0;
    const taskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const emailSent = emailAnalytics.data?.length || 0;
    const emailOpened = emailAnalytics.data?.filter(e => e.opened_at).length || 0;
    const emailClicked = emailAnalytics.data?.filter(e => e.clicked_at).length || 0;
    const openRate = emailSent > 0 ? (emailOpened / emailSent) * 100 : 0;
    const clickRate = emailSent > 0 ? (emailClicked / emailSent) * 100 : 0;

    const atRisk = segments.data?.filter(s => s.segment === 'at_risk').length || 0;
    const activeCustomers = segments.data?.filter(s => s.segment === 'active').length || 0;

    const proposalsSent = proposals.data?.filter(p => p.status === 'sent').length || 0;
    const proposalsAccepted = proposals.data?.filter(p => p.status === 'accepted').length || 0;
    const proposalWinRate = proposalsSent > 0 ? (proposalsAccepted / proposalsSent) * 100 : 0;

    setStats({
      revenue, expense, profit, margin, revenueTrend, expenseTrend,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      collectionRate,
      totalCustomers: customers.data?.length || 0,
      activeCustomers,
      atRiskCustomers: atRisk,
      lowStock: lowStock.length,
      totalStock,
      taskCompletion,
      completedTasks,
      totalTasks,
      upcomingAppointments: appointments.data?.length || 0,
      emailOpenRate: openRate,
      emailClickRate: clickRate,
      proposalWinRate
    });

    setTrends({ revenueTrend, expenseTrend });

    // AI Suggestions
    const suggestions = [];
    if (overdueInvoices.length > 0) suggestions.push({ icon: AlertCircle, color: 'text-red-500', text: `${overdueInvoices.length} overdue invoices - Send reminders now`, action: '/business/invoice-reminders' });
    if (lowStock.length > 0) suggestions.push({ icon: Package, color: 'text-orange-500', text: `${lowStock.length} items low on stock - Generate purchase orders`, action: '/business/inventory-intelligence' });
    if (atRisk > 0) suggestions.push({ icon: Users, color: 'text-yellow-500', text: `${atRisk} customers at risk - Launch re-engagement campaign`, action: '/business/customer-intelligence' });
    if (margin < 10) suggestions.push({ icon: TrendingDown, color: 'text-red-500', text: 'Low profit margin - Review pricing strategy', action: '/reports/profit-loss' });
    if (openRate < 20) suggestions.push({ icon: Mail, color: 'text-blue-500', text: 'Low email open rate - Improve subject lines', action: '/marketing/email-analytics' });
    if (taskCompletion < 50) suggestions.push({ icon: CheckCircle, color: 'text-purple-500', text: `${totalTasks - completedTasks} pending tasks - Prioritize completion`, action: '/business/tasks' });
    setAiSuggestions(suggestions);

    // Recent Activity
    const recent = cashbook.data?.slice(0, 8).map(t => ({
      text: `${t.type === 'income' ? '+' : '-'}${formatAmount(t.amount)} - ${t.description}`,
      time: new Date(t.date).toLocaleDateString(),
      type: t.type
    })) || [];
    setRecentActivity(recent);

    // Top Customers
    const customerRevenue = customers.data?.map(c => {
      const total = invoices.data?.filter(i => i.customer_id === c.id && i.payment_status === 'paid').reduce((s, i) => s + parseFloat(i.total_amount), 0) || 0;
      return { ...c, revenue: total };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || [];
    setTopCustomers(customerRevenue);

    setLowStockItems(lowStock.slice(0, 5));

    // Upcoming Events
    const events = [
      ...appointments.data?.slice(0, 3).map(a => ({ type: 'appointment', text: a.title, time: new Date(a.date).toLocaleString() })) || [],
      ...tasks.data?.filter(t => t.status === 'pending' && t.due_date).slice(0, 2).map(t => ({ type: 'task', text: t.title, time: new Date(t.due_date).toLocaleString() })) || []
    ];
    setUpcomingEvents(events.slice(0, 5));
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <AIBriefingCard userId={user?.id || ''} userName={userName} />
      <div className="space-y-4">
        {/* Header with Greeting */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}, {userName}</h1>
            <p className="text-sm text-muted-foreground">Real-time business insights</p>
          </div>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</p>
        </div>

        {/* AI Suggestions Banner */}
        {aiSuggestions.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold">AI Recommendations</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {aiSuggestions.map((s, i) => (
                <Link key={i} to={s.action} className="flex items-center gap-2 p-2 rounded hover:bg-background/50">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs">{s.text}</span>
                  <ArrowUpRight className="w-3 h-3 ml-auto" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-card border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className={`text-xs ${trends.revenueTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trends.revenueTrend >= 0 ? '↑' : '↓'} {Math.abs(trends.revenueTrend || 0).toFixed(1)}%
              </span>
            </div>
            <p className="text-lg font-bold truncate">{formatAmount(stats.revenue || 0)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>

          <div className="bg-card border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className={`text-xs ${trends.expenseTrend <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trends.expenseTrend >= 0 ? '↑' : '↓'} {Math.abs(trends.expenseTrend || 0).toFixed(1)}%
              </span>
            </div>
            <p className="text-lg font-bold truncate">{formatAmount(stats.expense || 0)}</p>
            <p className="text-xs text-muted-foreground">Expenses</p>
          </div>

          <div className="bg-card border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-blue-500">{(stats.margin || 0).toFixed(1)}%</span>
            </div>
            <p className="text-lg font-bold truncate">{formatAmount(stats.profit || 0)}</p>
            <p className="text-xs text-muted-foreground">Profit</p>
          </div>

          <div className="bg-card border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-orange-500" />
              {stats.overdueInvoices > 0 && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-lg font-bold">{stats.pendingInvoices || 0}</p>
            <p className="text-xs text-muted-foreground">{stats.overdueInvoices || 0} overdue</p>
          </div>

          <div className="bg-card border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-green-500">{stats.activeCustomers || 0} active</span>
            </div>
            <p className="text-lg font-bold">{stats.totalCustomers || 0}</p>
            <p className="text-xs text-muted-foreground">{stats.atRiskCustomers || 0} at risk</p>
          </div>

          <div className="bg-card border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-yellow-500" />
              {stats.lowStock > 0 && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-lg font-bold truncate">{formatAmount(stats.totalStock || 0)}</p>
            <p className="text-xs text-muted-foreground">{stats.lowStock || 0} low stock</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Task Completion</span>
              <span className="text-xs text-muted-foreground">{stats.completedTasks}/{stats.totalTasks}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${stats.taskCompletion}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.taskCompletion?.toFixed(0)}% complete</p>
          </div>

          <div className="bg-card border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Invoice Collection</span>
              <span className="text-xs text-muted-foreground">{stats.collectionRate?.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${stats.collectionRate}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.collectionRate >= 80 ? 'Excellent' : stats.collectionRate >= 60 ? 'Good' : 'Needs improvement'}</p>
          </div>

          <div className="bg-card border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Email Engagement</span>
              <span className="text-xs text-muted-foreground">{stats.emailOpenRate?.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${stats.emailOpenRate}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.emailClickRate?.toFixed(1)}% click rate</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Recent Activity */}
          <div className="bg-card border rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Transactions
            </h3>
            <div className="space-y-1">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className={a.type === 'income' ? 'text-green-500' : 'text-red-500'}>{a.text}</span>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-card border rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Top Customers
            </h3>
            <div className="space-y-1">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate">{c.name}</span>
                  <span className="font-medium">{formatAmount(c.revenue || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Check-In */}
          <div>
            <QuickCheckIn />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Low Stock Alert */}
          <div className="bg-card border rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Low Stock Items
            </h3>
            <div className="space-y-1">
              {lowStockItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate">{item.name}</span>
                  <span className="text-red-500 font-medium">{item.quantity} left</span>
                </div>
              ))}
              {lowStockItems.length === 0 && <p className="text-xs text-muted-foreground">All items in stock</p>}
            </div>
          </div>
          {/* Upcoming Events */}
          <div className="bg-card border rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming Events
            </h3>
            <div className="space-y-1">
              {upcomingEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full mt-1 ${e.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  <div className="flex-1">
                    <p>{e.text}</p>
                    <p className="text-xs text-muted-foreground">{e.time}</p>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && <p className="text-xs text-muted-foreground">No upcoming events</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




