import { Briefcase, Table, Users, Wallet, FileText, TrendingUp, CreditCard, BookOpen, DollarSign, Bell, Package, Calendar, CheckSquare, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  { name: "Sales Dashboard", desc: "Revenue, sales & analytics", icon: TrendingUp, link: "/business/sales", color: "hsl(var(--module-business))" },
  { name: "Cashbook", desc: "Income & expense tracking", icon: Wallet, link: "/business/cashbook", color: "hsl(var(--module-business))" },
  { name: "Invoice Generator", desc: "Create & send PDF invoices", icon: FileText, link: "/business/invoices", color: "hsl(var(--module-business))" },
  { name: "Customers", desc: "Manage customer database", icon: Users, link: "/business/customers", color: "hsl(var(--module-business))" },
  { name: "Bookkeeping", desc: "Financial records & reports", icon: BookOpen, link: "/business/bookkeeping", color: "hsl(var(--module-business))" },
  { name: "Staff Management", desc: "Employee database", icon: Users, link: "/business/staff", color: "hsl(var(--module-business))" },
  { name: "Stock Management", desc: "Inventory & stock tracking", icon: Package, link: "/business/stock", color: "hsl(var(--module-business))" },
  { name: "Appointments", desc: "Schedule meetings & tasks", icon: Calendar, link: "/business/appointments", color: "hsl(var(--module-business))" },
  { name: "Tasks", desc: "Task management & tracking", icon: CheckSquare, link: "/business/tasks", color: "hsl(var(--module-business))" },
  { name: "Spreadsheet AI", desc: "Ask questions about your data", icon: Table, link: "/business/spreadsheet", color: "hsl(var(--module-business))" },
];

const BusinessToolsPage = () => (
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
        <Briefcase className="w-5 h-5" style={{ color: "hsl(var(--module-business))" }} /> Business Tools
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Financial and operational tools</p>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
);

export default BusinessToolsPage;
