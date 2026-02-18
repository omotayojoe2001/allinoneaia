import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";

const quickStats = [
  { label: "Active Chats", value: "3", change: "+2 today", icon: MessageSquare, color: "--module-chat" },
  { label: "Automations Run", value: "47", change: "+12 this week", icon: Zap, color: "--module-automation" },
  { label: "Tickets Open", value: "8", change: "2 urgent", icon: Headphones, color: "--module-customer" },
  { label: "Content Created", value: "15", change: "+5 today", icon: Palette, color: "--module-content" },
];

const recentActivity = [
  { type: "automation", text: "WhatsApp follow-up sent to 23 leads", time: "2 min ago", icon: Zap, color: "--module-automation" },
  { type: "content", text: "Blog post \"AI in 2026\" published", time: "18 min ago", icon: Palette, color: "--module-content" },
  { type: "social", text: "3 scheduled posts went live on Instagram", time: "1 hr ago", icon: Share2, color: "--module-social" },
  { type: "customer", text: "Customer call summarized — ticket #412", time: "2 hrs ago", icon: Headphones, color: "--module-customer" },
  { type: "reminder", text: "Reminder sent: \"Review Q1 financials\"", time: "3 hrs ago", icon: Bell, color: "--module-reminders" },
  { type: "chat", text: "AI Chat assisted with proposal draft", time: "4 hrs ago", icon: MessageSquare, color: "--module-chat" },
];

const moduleStatus = [
  { name: "Social Media", status: "3 posts scheduled", icon: Share2, color: "--module-social", active: true },
  { name: "Business Tools", status: "Cashbook synced", icon: Briefcase, color: "--module-business", active: true },
  { name: "Reminders", status: "5 active, 2 due today", icon: Bell, color: "--module-reminders", active: true },
  { name: "Life Automation", status: "Coming soon", icon: Sparkles, color: "--module-life", active: false },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  const firstName = profile?.first_name || 'there';

  return (
    <div className="flex-1 overflow-y-auto">
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
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `hsl(var(${stat.color}) / 0.15)` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: `hsl(var(${stat.color}))` }} />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              <div className="text-xs mt-1" style={{ color: `hsl(var(${stat.color}))` }}>{stat.change}</div>
            </motion.div>
          ))}
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

          {/* Module Status */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card rounded-lg p-5"
          >
            <h2 className="text-foreground font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              Module Status
            </h2>
            <div className="space-y-3">
              {moduleStatus.map((mod) => (
                <div key={mod.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `hsl(var(${mod.color}) / 0.12)` }}
                  >
                    <mod.icon className="w-4 h-4" style={{ color: `hsl(var(${mod.color}))` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">{mod.status}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${mod.active ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                </div>
              ))}
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

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card rounded-lg p-5"
          >
            <h2 className="text-foreground font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              Upcoming
            </h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-foreground">3 social posts scheduled for 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--module-automation))" }} />
                <span className="text-foreground">Email sequence starts at 6:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--module-reminders))" }} />
                <span className="text-foreground">Reminder: Review weekly analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--module-customer))" }} />
                <span className="text-foreground">2 support tickets awaiting response</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
