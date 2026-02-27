import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Zap,
  Headphones,
  Palette,
  Share2,
  Briefcase,
  Bell,
  Sparkles,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Calendar,
  Users,
  Package,
  TrendingUp,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Sparkles, label: "AI Agent", path: "/ai-agent" },
  { 
    icon: Briefcase, 
    label: "Business", 
    path: "/business",
    submenu: [
      { label: "Cashbook", path: "/business/cashbook" },
      { label: "Invoices", path: "/business/invoices" },
      { label: "Customers", path: "/business/customers" },
      { label: "Customer Intelligence", path: "/business/customer-intelligence" },
      { label: "Tasks", path: "/business/tasks" },
      { label: "Appointments", path: "/business/appointments" },
      { label: "Stock", path: "/business/stock" },
      { label: "Inventory Intelligence", path: "/business/inventory-intelligence" },
      { label: "Staff", path: "/business/staff" },
      { label: "Bookkeeping", path: "/business/bookkeeping" },
      { label: "Salary", path: "/business/salary" },
      { label: "Payroll", path: "/business/payroll" },
      { label: "Contracts", path: "/business/contracts" },
      { label: "Payment Settings", path: "/business/payment-settings" },
      { label: "Invoice Reminders", path: "/business/invoice-reminders" },
      { label: "Proposals & Quotes", path: "/business/proposals" },
    ]
  },
  {
    icon: TrendingUp,
    label: "Reports",
    path: "/reports",
    submenu: [
      { label: "P&L Report", path: "/reports/profit-loss" },
      { label: "Tax Calculator", path: "/reports/tax-calculator" },
      { label: "Spending Patterns", path: "/reports/spending-patterns" },
      { label: "Cash Flow Forecast", path: "/reports/cash-flow" },
      { label: "AI Analytics", path: "/reports/ai-analytics" },
      { label: "Executive Dashboard", path: "/reports/executive" },
      { label: "Custom Report Builder", path: "/reports/custom-builder" },
      { label: "Budget vs Actual", path: "/reports/budget-vs-actual" },
      { label: "Financial Health", path: "/reports/financial-health" },
    ]
  },
  { 
    icon: Palette, 
    label: "Marketing", 
    path: "/content",
    submenu: [
      { label: "Content Studio", path: "/content" },
      { label: "AI Writer", path: "/content/writer" },
      { label: "Grammar Check", path: "/content/grammar" },
      { label: "Document Editor", path: "/content/editor" },
      { label: "Presentation AI", path: "/content/presentation" },
      { label: "SEO Optimizer", path: "/content/seo" },
      { label: "Voiceover AI", path: "/content/voiceover" },
      { label: "Social Manager", path: "/social-manager" },
      { label: "Social Scheduler", path: "/social/scheduler" },
      { label: "Growth Services", path: "/social" },
      { label: "Email Analytics", path: "/marketing/email-analytics" },
      { label: "Email Sequences", path: "/marketing/email-sequences" },
      { label: "Unsubscribe Mgmt", path: "/marketing/unsubscribe" },
      { label: "Deliverability", path: "/marketing/deliverability" },
      { label: "Bulk Sender", path: "/marketing/bulk-sender" },
      { label: "CRM Triggers", path: "/marketing/crm-triggers" },
    ]
  },
  { icon: Bot, label: "Chatbot Builder", path: "/chat" },
  { icon: Zap, label: "Automation", path: "/automation" },
  { icon: Bell, label: "Reminders", path: "/reminders" },
];

const bottomItems = [
  { 
    icon: Settings, 
    label: "Settings", 
    path: "/settings",
    submenu: [
      { label: "Billing", path: "/billing" },
      { label: "Subscription", path: "/settings/subscription" },
      { label: "Notifications", path: "/settings/notifications" },
      { label: "Help Center", path: "/settings/help" },
    ]
  },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border z-50"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-foreground text-lg whitespace-nowrap overflow-hidden"
            >
              NexusAI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isExpanded = expandedMenu === item.path;
          const isSubmenuActive = hasSubmenu && item.submenu.some(sub => location.pathname === sub.path);
          
          return (
            <div key={item.path}>
              {hasSubmenu ? (
                <button
                  onClick={() => toggleSubmenu(item.path)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative w-full",
                    isActive || isSubmenuActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {(isActive || isSubmenuActive) && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                    />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap overflow-hidden flex-1 text-left"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && (
                    <span className="ml-auto">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                    />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}
              
              {/* Submenu */}
              {hasSubmenu && isExpanded && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-8 mt-1 space-y-1"
                >
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        location.pathname === subItem.path
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="py-4 px-2 space-y-1 border-t border-sidebar-border">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isExpanded = expandedMenu === item.path;
          const isSubmenuActive = hasSubmenu && item.submenu.some(sub => location.pathname === sub.path);
          
          return (
            <div key={item.path}>
              {hasSubmenu ? (
                <button
                  onClick={() => toggleSubmenu(item.path)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative w-full",
                    isActive || isSubmenuActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap overflow-hidden flex-1 text-left"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && (
                    <span className="ml-auto">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}
              
              {hasSubmenu && isExpanded && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-8 mt-1 space-y-1"
                >
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        location.pathname === subItem.path
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
