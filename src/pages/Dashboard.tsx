import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import ThemeToggle from "@/components/ThemeToggle";
import {
  MessageSquare,
  Zap,
  Headphones,
  Palette,
  Share2,
  Briefcase,
  Bell,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpense: 0,
    pendingInvoices: 0,
    totalCustomers: 0,
    lowStock: 0,
    pendingTasks: 0,
    upcomingAppointments: 0,
    overdueReminders: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<any[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<any>(null);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      fetchDashboardData();
      checkOverdueReminders();
    }
  }, [user]);

  const checkOverdueReminders = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('due_date', now)
      .order('due_date', { ascending: true });
    
    if (data && data.length > 0) {
      setOverdueReminders(data);
      setShowReminderModal(true);
    }
  };

  const markReminderDone = async (id: string) => {
    await supabase.from('reminders').update({ status: 'completed' }).eq('id', id);
    setOverdueReminders(prev => prev.filter(r => r.id !== id));
    if (overdueReminders.length === 1) {
      setShowReminderModal(false);
      setCurrentReminder(null);
      setShowSnoozeOptions(false);
    }
    fetchDashboardData();
  };

  const handleNo = (reminder: any) => {
    setCurrentReminder(reminder);
    setShowSnoozeOptions(true);
  };

  const snoozeReminder = async (id: string, minutes: number) => {
    const newTime = new Date(Date.now() + minutes * 60000).toISOString();
    await supabase.from('reminders').update({ due_date: newTime }).eq('id', id);
    setOverdueReminders(prev => prev.filter(r => r.id !== id));
    setCurrentReminder(null);
    setShowSnoozeOptions(false);
    if (overdueReminders.length === 1) setShowReminderModal(false);
  };

  const remindLater = async (id: string, hours: number) => {
    const newTime = new Date(Date.now() + hours * 3600000).toISOString();
    await supabase.from('reminders').update({ due_date: newTime }).eq('id', id);
    setOverdueReminders(prev => prev.filter(r => r.id !== id));
    setCurrentReminder(null);
    setShowSnoozeOptions(false);
    if (overdueReminders.length === 1) setShowReminderModal(false);
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    const now = new Date().toISOString();
    const [cashbook, invoices, customers, stock, tasks, appointments, reminders] = await Promise.all([
      supabase.from('cashbook_transactions').select('*').eq('user_id', user.id),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('customers').select('*').eq('user_id', user.id),
      supabase.from('stock').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending'),
      supabase.from('appointments').select('*').eq('user_id', user.id).eq('status', 'scheduled'),
      supabase.from('reminders').select('*').eq('user_id', user.id).eq('status', 'pending').lt('due_date', now)
    ]);

    const revenue = cashbook.data?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const expense = cashbook.data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const pending = invoices.data?.filter(i => i.payment_status === 'unpaid').length || 0;
    const lowStockItems = stock.data?.filter(s => s.quantity <= (s.reorder_level || 0)).length || 0;

    setStats({
      totalRevenue: revenue,
      totalExpense: expense,
      pendingInvoices: pending,
      totalCustomers: customers.data?.length || 0,
      lowStock: lowStockItems,
      pendingTasks: tasks.data?.length || 0,
      upcomingAppointments: appointments.data?.length || 0,
      overdueReminders: reminders.data?.length || 0
    });

    // Recent activity from cashbook
    const recent = cashbook.data?.slice(0, 6).map(t => ({
      text: `${t.type === 'income' ? 'Income' : 'Expense'}: ${t.description}`,
      time: getTimeAgo(t.date),
      icon: DollarSign,
      color: '--module-business'
    })) || [];
    setRecentActivity(recent);
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const firstName = profile?.first_name || 'there';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Overdue Reminders Modal */}
      {showReminderModal && overdueReminders.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                Overdue Reminders ({overdueReminders.length})
              </h2>
              <button onClick={() => setShowReminderModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {overdueReminders.map((reminder) => (
                <div key={reminder.id} className="glass-card rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          reminder.priority === 'urgent' ? 'bg-red-500/15 text-red-400' :
                          reminder.priority === 'high' ? 'bg-orange-500/15 text-orange-400' :
                          reminder.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                          'bg-blue-500/15 text-blue-400'
                        }`}>{reminder.priority?.toUpperCase()}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{reminder.category}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{reminder.title}</p>
                      {reminder.description && <p className="text-xs text-muted-foreground mt-1">{reminder.description}</p>}
                      <p className="text-xs text-red-400 mt-2">Due: {new Date(reminder.due_date).toLocaleString()}</p>
                    </div>
                    {showSnoozeOptions && currentReminder?.id === reminder.id ? (
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <p className="text-xs text-muted-foreground mb-1">Snooze for:</p>
                        <button onClick={() => snoozeReminder(reminder.id, 15)} className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-sm hover:bg-blue-500/25">
                          15 minutes
                        </button>
                        <button onClick={() => snoozeReminder(reminder.id, 30)} className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-sm hover:bg-blue-500/25">
                          30 minutes
                        </button>
                        <button onClick={() => remindLater(reminder.id, 1)} className="px-3 py-1.5 bg-purple-500/15 text-purple-400 rounded-lg text-sm hover:bg-purple-500/25">
                          1 hour later
                        </button>
                        <button onClick={() => remindLater(reminder.id, 3)} className="px-3 py-1.5 bg-purple-500/15 text-purple-400 rounded-lg text-sm hover:bg-purple-500/25">
                          3 hours later
                        </button>
                        <button onClick={() => { setShowSnoozeOptions(false); setCurrentReminder(null); }} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:bg-secondary/80">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => markReminderDone(reminder.id)} className="px-3 py-1.5 bg-green-500/15 text-green-400 rounded-lg text-sm hover:bg-green-500/25">
                          ✓ Yes/Done
                        </button>
                        <button onClick={() => handleNo(reminder)} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:bg-secondary/80">
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

      <div className="relative max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Good afternoon, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              Here's what's happening across your workspace today.
            </p>
          </div>
          <ThemeToggle />
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-business) / 0.15)' }}>
                <DollarSign className="w-4 h-4" style={{ color: 'hsl(var(--module-business))' }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{formatAmount(stats.totalRevenue)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Revenue</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-business) / 0.15)' }}>
                <FileText className="w-4 h-4" style={{ color: 'hsl(var(--module-business))' }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.pendingInvoices}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Pending Invoices</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-business) / 0.15)' }}>
                <Users className="w-4 h-4" style={{ color: 'hsl(var(--module-business))' }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalCustomers}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Customers</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-reminders) / 0.15)' }}>
                <Bell className="w-4 h-4" style={{ color: 'hsl(var(--module-reminders))' }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.overdueReminders}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Overdue Reminders</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foreground font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Recent Activity
              </h2>
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `hsl(var(${item.color}) / 0.1)` }}
                  >
                    <item.icon className="w-3.5 h-3.5" style={{ color: `hsl(var(${item.color}))` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-lg p-5">
            <h2 className="text-foreground font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              Business Overview
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-business) / 0.12)' }}>
                  <Package className="w-4 h-4" style={{ color: 'hsl(var(--module-business))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Low Stock Items</p>
                  <p className="text-xs text-muted-foreground">{stats.lowStock} items need reorder</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-business) / 0.12)' }}>
                  <Calendar className="w-4 h-4" style={{ color: 'hsl(var(--module-business))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Appointments</p>
                  <p className="text-xs text-muted-foreground">{stats.upcomingAppointments} scheduled</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-business) / 0.12)' }}>
                  <Briefcase className="w-4 h-4" style={{ color: 'hsl(var(--module-business))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Pending Tasks</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingTasks} tasks to complete</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--module-business) / 0.12)' }}>
                  <DollarSign className="w-4 h-4" style={{ color: 'hsl(var(--module-business))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Net Balance</p>
                  <p className="text-xs text-muted-foreground">{formatAmount(stats.totalRevenue - stats.totalExpense)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-lg p-5"
          >
            <h2 className="text-foreground font-semibold flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              Subscription
            </h2>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg font-bold text-foreground">Pro Plan</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">$49/mo · Renews Mar 15, 2026</p>
            <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: "62%" }} />
            </div>
            <p className="text-xs text-muted-foreground">62% of monthly credits used</p>
          </motion.div>

          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-lg p-5">
            <h2 className="text-foreground font-semibold flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              Quick Summary
            </h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--module-business))' }} />
                <span className="text-foreground">{stats.pendingInvoices} invoices awaiting payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--module-reminders))' }} />
                <span className="text-foreground">{stats.overdueReminders} reminders overdue</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--module-business))' }} />
                <span className="text-foreground">{stats.upcomingAppointments} appointments scheduled</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--module-business))' }} />
                <span className="text-foreground">{stats.pendingTasks} tasks to complete</span>
              </div>
              {stats.lowStock > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-foreground">{stats.lowStock} items low on stock</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
