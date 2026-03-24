import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Zap,
  Palette,
  Briefcase,
  Bell,
  Sparkles,
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
  FileText,
  DollarSign,
  BarChart3,
  Mail,
  Wallet,
  UserCheck,
  Box,
  Briefcase as BriefcaseIcon,
  ClipboardList,
  ListChecks,
  PieChart,
  Brain,
  Calculator,
  Wrench,
  PenTool,
  Share2,
  Send,
  Clock,
  Menu,
  X,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Sparkles, label: "AI Agent", path: "/ai-agent" },
  { 
    icon: Briefcase, 
    label: "Business", 
    path: "/business",
    tooltip: "Finance, Customers, Inventory, Staff, Contracts, Proposals",
    submenu: [
      { icon: Wallet, label: "Finance", path: "/business/finance" },
      { icon: Users, label: "Customers", path: "/business/customers-hub" },
      { icon: Package, label: "Inventory", path: "/business/inventory-hub" },
      { icon: UserCheck, label: "Staff & Payroll", path: "/business/staff-hub" },
      { icon: FileText, label: "Contracts", path: "/business/contracts" },
      { icon: ClipboardList, label: "Proposals & Quotes", path: "/business/proposals" },
      { icon: CheckSquare, label: "Tasks", path: "/business/tasks" },
    ]
  },
  {
    icon: TrendingUp,
    label: "Reports",
    path: "/reports",
    tooltip: "Financial Reports, Analytics, Custom Reports",
    submenu: [
      { icon: PieChart, label: "Financial Reports", path: "/reports/financial-hub" },
      { icon: Brain, label: "AI Analytics", path: "/reports/ai-analytics-hub" },
      { icon: Calculator, label: "Tax Calculator", path: "/reports/tax-calculator" },
      { icon: Wrench, label: "Custom Report Builder", path: "/reports/custom-builder" },
    ]
  },
  { 
    icon: Palette, 
    label: "Marketing", 
    path: "/content",
    tooltip: "Content Creation, Social Media, Email Marketing",
    submenu: [
      { icon: PenTool, label: "Content Creation", path: "/content/hub" },
      { icon: Share2, label: "Social Media", path: "/social/hub" },
      { icon: Mail, label: "Email Marketing", path: "/marketing/email-hub" },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  const sidebarWidth = isMobile ? (mobileOpen ? 240 : 0) : (collapsed ? 72 : 240);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Hamburger Button */}
      {isMobile && (
        <motion.button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-primary text-primary-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </motion.button>
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{
          width: sidebarWidth,
          x: isMobile && !mobileOpen ? -240 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 flex flex-col bg-sidebar border-r border-sidebar-border z-50 lg:z-40"
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
                BizSuiteAI
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
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    {item.tooltip && (
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-xs">{item.tooltip}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
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
                    className="ml-4 mt-1 space-y-1"
                  >
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
                          location.pathname === subItem.path
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        {subItem.icon && <subItem.icon className="w-3.5 h-3.5" />}
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
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
            title="Reload page"
          >
            <RotateCw className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Reload
                </motion.span>
              )}
            </AnimatePresence>
          </button>

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

          <div className="flex items-center gap-3 px-3 py-2.5">
            {!collapsed && <span className="text-sm text-sidebar-foreground">Theme</span>}
            <ThemeToggle />
          </div>

          {!isMobile && (
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
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default AppSidebar;
