import { useState, useEffect } from "react";
import { ArrowLeft, DollarSign, TrendingUp, Users, Package, FileText, Calendar, CheckSquare, Wallet, Filter, Mail, MessageCircle, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SpreadsheetAI() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [currentQuery, setCurrentQuery] = useState<any>(null);
  const [actionButtons, setActionButtons] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("first_name").eq("id", user.id).single().then(({ data }) => {
        setFirstName(data?.first_name || "there");
      });
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickQuestions = [
    { 
      label: "Total Invoice Revenue", 
      icon: FileText,
      supportsDateFilter: true,
      query: async (from?: string, to?: string) => {
        let query = supabase.from("invoices").select("total_amount").eq("user_id", user?.id);
        if (from) query = query.gte("created_at", from);
        if (to) query = query.lte("created_at", to);
        const { data } = await query;
        const total = data?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
        const period = from && to ? ` from ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()}` : " for all time";
        setActionButtons([{ label: "View All Invoices", link: "/business/invoices" }]);
        return `${getGreeting()}, ${firstName}! Your total invoice revenue${period} is ${formatAmount(total)}.`;
      }
    },
    { 
      label: "Unpaid Invoices", 
      icon: FileText,
      supportsDateFilter: false,
      query: async () => {
        const { data } = await supabase.from("invoices").select("*").eq("user_id", user?.id).eq("payment_status", "unpaid");
        const total = data?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
        setDetailData(data);
        setActionButtons(data?.length ? [
          { label: "Yes, View Unpaid Invoices", link: "/business/invoices" },
          { label: "No, Not Now", action: "dismiss" }
        ] : []);
        return `${getGreeting()}, ${firstName}! You currently have ${data?.length || 0} unpaid invoice${data?.length !== 1 ? 's' : ''} totaling ${formatAmount(total)}. ${data?.length ? 'Would you like to follow up on these?' : ''}`;
      }
    },
    { 
      label: "Total Cashbook Income", 
      icon: DollarSign,
      supportsDateFilter: true,
      query: async (from?: string, to?: string) => {
        let query = supabase.from("cashbook_transactions").select("amount").eq("user_id", user?.id).eq("type", "income");
        if (from) query = query.gte("date", from);
        if (to) query = query.lte("date", to);
        const { data } = await query;
        const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        const period = from && to ? ` from ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()}` : " for all time";
        setActionButtons([{ label: "View Cashbook", link: "/business/cashbook" }]);
        return `${getGreeting()}, ${firstName}! Your total income${period} is ${formatAmount(total)}. Keep up the great work!`;
      }
    },
    { 
      label: "Total Cashbook Expenses", 
      icon: TrendingUp,
      supportsDateFilter: true,
      query: async (from?: string, to?: string) => {
        let query = supabase.from("cashbook_transactions").select("amount").eq("user_id", user?.id).eq("type", "expense");
        if (from) query = query.gte("date", from);
        if (to) query = query.lte("date", to);
        const { data } = await query;
        const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        const period = from && to ? ` from ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()}` : " for all time";
        setActionButtons([{ label: "View Cashbook", link: "/business/cashbook" }]);
        return `${getGreeting()}, ${firstName}! Your total expenses${period} are ${formatAmount(total)}.`;
      }
    },
    { 
      label: "Net Balance", 
      icon: Wallet,
      supportsDateFilter: true,
      query: async (from?: string, to?: string) => {
        let incomeQuery = supabase.from("cashbook_transactions").select("amount").eq("user_id", user?.id).eq("type", "income");
        let expenseQuery = supabase.from("cashbook_transactions").select("amount").eq("user_id", user?.id).eq("type", "expense");
        if (from) {
          incomeQuery = incomeQuery.gte("date", from);
          expenseQuery = expenseQuery.gte("date", from);
        }
        if (to) {
          incomeQuery = incomeQuery.lte("date", to);
          expenseQuery = expenseQuery.lte("date", to);
        }
        const { data: income } = await incomeQuery;
        const { data: expense } = await expenseQuery;
        const totalIncome = income?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        const totalExpense = expense?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        const balance = totalIncome - totalExpense;
        const period = from && to ? ` from ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()}` : " for all time";
        setActionButtons([{ label: "View Cashbook", link: "/business/cashbook" }]);
        return `${getGreeting()}, ${firstName}! Your net balance${period} is ${formatAmount(balance)}. ${balance > 0 ? "You're doing great!" : "Consider reviewing your expenses."}`;
      }
    },
    { 
      label: "Total Customers", 
      icon: Users,
      supportsDateFilter: false,
      query: async () => {
        const { data } = await supabase.from("customers").select("*").eq("user_id", user?.id);
        setDetailData(data);
        setActionButtons(data?.length ? [
          { label: "View Customers", link: "/business/customers" },
          { label: "Message Customers", link: "/business/customers" }
        ] : [{ label: "Add First Customer", link: "/business/customers" }]);
        return `${getGreeting()}, ${firstName}! You have ${data?.length || 0} customer${data?.length !== 1 ? 's' : ''} in your database. ${data?.length ? "Your network is growing!" : "Start adding customers to grow your business."}`;
      }
    },
    { 
      label: "Low Stock Items", 
      icon: Package,
      supportsDateFilter: false,
      query: async () => {
        const { data } = await supabase.from("stock").select("*").eq("user_id", user?.id);
        const lowStock = data?.filter(item => parseInt(item.quantity) <= (item.reorder_level || 10)) || [];
        setDetailData(lowStock);
        setActionButtons(lowStock.length ? [{ label: "View Stock Items", link: "/business/stock" }] : []);
        return `${getGreeting()}, ${firstName}! You have ${lowStock.length} item${lowStock.length !== 1 ? 's' : ''} with low stock. ${lowStock.length > 0 ? "Consider reordering soon to avoid stockouts." : "All items are well stocked!"}`;
      }
    },
    { 
      label: "Pending Appointments", 
      icon: Calendar,
      supportsDateFilter: false,
      query: async () => {
        const { data } = await supabase.from("appointments").select("*").eq("user_id", user?.id).eq("status", "scheduled").order("date", { ascending: true });
        setDetailData(data);
        const nextAppointment = data?.[0];
        const appointmentDetails = nextAppointment ? ` Your next appointment is on ${new Date(nextAppointment.date).toLocaleDateString()} at ${nextAppointment.time}.` : "";
        setActionButtons(data?.length ? [{ label: "View Appointments", link: "/business/appointments" }] : []);
        return `${getGreeting()}, ${firstName}! You have ${data?.length || 0} scheduled appointment${data?.length !== 1 ? 's' : ''}.${appointmentDetails} ${data?.length ? "Don't forget to prepare for them!" : "Your schedule is clear."}`;
      }
    },
    { 
      label: "Pending Tasks", 
      icon: CheckSquare,
      supportsDateFilter: false,
      query: async () => {
        const { data } = await supabase.from("tasks").select("*").eq("user_id", user?.id).eq("status", "pending").order("due_date", { ascending: true });
        setDetailData(data);
        const taskList = data?.slice(0, 3).map(t => t.title).join(", ") || "";
        const taskDetails = data?.length ? ` Your pending tasks include: ${taskList}${data.length > 3 ? ` and ${data.length - 3} more` : ''}.` : "";
        setActionButtons(data?.length ? [{ label: "View Tasks", link: "/business/tasks" }] : []);
        return `${getGreeting()}, ${firstName}! You have ${data?.length || 0} pending task${data?.length !== 1 ? 's' : ''}.${taskDetails} ${data?.length ? "Let's get them done!" : "All caught up!"}`;
      }
    },
    { 
      label: "This Month Revenue", 
      icon: DollarSign,
      supportsDateFilter: false,
      query: async () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const { data } = await supabase.from("cashbook_transactions").select("amount").eq("user_id", user?.id).eq("type", "income").gte("date", monthStart);
        const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        setActionButtons([{ label: "View Cashbook", link: "/business/cashbook" }]);
        return `${getGreeting()}, ${firstName}! Your revenue this month is ${formatAmount(total)}. ${total > 0 ? "Great progress!" : "Let's work on increasing sales."}`;
      }
    },
    { 
      label: "This Month Expenses", 
      icon: TrendingUp,
      supportsDateFilter: false,
      query: async () => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const { data } = await supabase.from("cashbook_transactions").select("amount").eq("user_id", user?.id).eq("type", "expense").gte("date", monthStart);
        const total = data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        setActionButtons([{ label: "View Cashbook", link: "/business/cashbook" }]);
        return `${getGreeting()}, ${firstName}! Your expenses this month are ${formatAmount(total)}.`;
      }
    },
    { 
      label: "Staff Count", 
      icon: Users,
      supportsDateFilter: false,
      query: async () => {
        const { data } = await supabase.from("staff").select("*").eq("user_id", user?.id);
        setDetailData(data);
        setActionButtons(data?.length ? [{ label: "View Staff", link: "/business/staff" }] : [{ label: "Add Staff", link: "/business/staff" }]);
        return `${getGreeting()}, ${firstName}! You have ${data?.length || 0} staff member${data?.length !== 1 ? 's' : ''}. ${data?.length ? "Your team is your strength!" : "Consider hiring staff to grow your business."}`;
      }
    },
    { 
      label: "Automations Sent Today", 
      icon: Send,
      supportsDateFilter: false,
      query: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data: emails } = await supabase.from("tasks").select("*").eq("user_id", user?.id).gte("created_at", today).eq("notification_sent", true);
        const { data: whatsapp } = await supabase.from("appointments").select("*").eq("user_id", user?.id).gte("created_at", today);
        const emailCount = emails?.length || 0;
        const whatsappCount = whatsapp?.length || 0;
        setActionButtons([
          { label: "View Tasks", link: "/business/tasks" },
          { label: "View Appointments", link: "/business/appointments" }
        ]);
        return `${getGreeting()}, ${firstName}! Today you've sent ${emailCount} email notification${emailCount !== 1 ? 's' : ''} and ${whatsappCount} WhatsApp notification${whatsappCount !== 1 ? 's' : ''}. ${emailCount + whatsappCount > 0 ? "Great job staying connected!" : "No automations sent yet today."}`;
      }
    },
  ];

  const handleQuickQuestion = async (question: any) => {
    setLoading(true);
    setResult("");
    setActionButtons([]);
    setDetailData(null);
    setCurrentQuery(question);
    setShowDateFilter(false);
    setDateRange({ from: "", to: "" });
    try {
      const answer = await question.query();
      setResult(answer);
      if (question.supportsDateFilter) {
        setShowDateFilter(true);
      }
    } catch (error) {
      setResult("Error fetching data. Please try again.");
    }
    setLoading(false);
  };

  const handleDateFilter = async () => {
    if (!currentQuery || !dateRange.from || !dateRange.to) return;
    setLoading(true);
    setActionButtons([]);
    try {
      const answer = await currentQuery.query(dateRange.from, dateRange.to);
      setResult(answer);
    } catch (error) {
      setResult("Error fetching data. Please try again.");
    }
    setLoading(false);
  };

  const handleAction = (button: any) => {
    if (button.action === "dismiss") {
      setResult("");
      setActionButtons([]);
      setDetailData(null);
    } else if (button.link) {
      navigate(button.link);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="w-full">
        <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold mb-6">Smart Reports</h1>

        <div className="glass-card rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Insights</h2>
          <p className="text-sm text-muted-foreground mb-4">Click any button to get instant insights about your business</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickQuestions.map((q, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => handleQuickQuestion(q)}
                disabled={loading}
              >
                <q.icon className="w-4 h-4 mr-2" />
                {q.label}
              </Button>
            ))}
          </div>
        </div>

        {result && (
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Result</h3>
            <p className="text-sm leading-relaxed mb-4">{result}</p>
            
            {actionButtons.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {actionButtons.map((btn, idx) => (
                  <Button 
                    key={idx} 
                    onClick={() => handleAction(btn)}
                    variant={btn.action === "dismiss" ? "outline" : "default"}
                    size="sm"
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            )}
            
            {showDateFilter && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium mb-3">Want to check a specific date range?</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">From Date</Label>
                    <Input 
                      type="date" 
                      value={dateRange.from} 
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">To Date</Label>
                    <Input 
                      type="date" 
                      value={dateRange.to} 
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    />
                  </div>
                  <Button 
                    onClick={handleDateFilter} 
                    disabled={!dateRange.from || !dateRange.to || loading}
                    className="flex-shrink-0"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filter
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="glass-card rounded-lg p-6">
            <p className="text-sm text-muted-foreground text-center">Calculating...</p>
          </div>
        )}
      </div>
    </div>
  );
}
