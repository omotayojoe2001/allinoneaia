import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { recordSalaryPayment } from "@/lib/business-integration";
import { syncStaffToList } from "@/lib/staff-sync";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PhoneInput } from "@/components/ui/phone-input";
import { generateSalaryReceipt } from "@/lib/salary-receipt-pdf";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function StaffManagement() {
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<"staff" | "list">("staff");
  const [staff, setStaff] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    name: "", email: "", phone: "", position: "", salary: "", payment_date: "",
    payment_cycle: "monthly", include_weekends: false, late_deduction_amount: "", auto_deduct_late: false
  });
  const [attendanceForm, setAttendanceForm] = useState({ staff_id: "", date: "", check_in: "", check_out: "", status: "present" });
  const [paymentForm, setPaymentForm] = useState({ staff_id: "", amount: "", month: "", status: "pending", paid_date: "" });
  const [profile, setProfile] = useState<any>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [attendanceViewOpen, setAttendanceViewOpen] = useState(false);
  const [paymentsViewOpen, setPaymentsViewOpen] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "today" | "week" | "month" | "custom">("today");
  const [attendanceStartDate, setAttendanceStartDate] = useState("");
  const [attendanceEndDate, setAttendanceEndDate] = useState("");
  const [attendanceStaffFilter, setAttendanceStaffFilter] = useState("");
  const [attendanceStaffSearch, setAttendanceStaffSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "paid">("all");
  const [paymentStaffFilter, setPaymentStaffFilter] = useState("");
  const [paymentStartDate, setPaymentStartDate] = useState("");
  const [paymentEndDate, setPaymentEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
    fetchStaffList();
    fetchAttendance();
    fetchPayments();
    loadProfile();
    syncStaff();
  }, []);

  const syncStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await syncStaffToList(user.id);
    fetchStaffList();
  };

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("staff").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setStaff(data || []);
  };

  const fetchStaffList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("staff_list").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setStaffList(data || []);
  };

  const fetchAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("attendance").select("*").eq("user_id", user.id).order("date", { ascending: false });
    setAttendance(data || []);
  };

  const fetchPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("salary_payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setPayments(data || []);
  };

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload: any = {
      user_id: user.id,
      name: form.name,
      payment_cycle: form.payment_cycle,
      include_weekends: form.include_weekends,
      auto_deduct_late: form.auto_deduct_late
    };

    if (form.email) payload.email = form.email;
    if (form.phone) payload.phone = form.phone;
    if (form.position) payload.position = form.position;
    if (form.salary) payload.salary = parseFloat(form.salary);
    if (form.payment_date) payload.payment_date = form.payment_date;
    if (form.late_deduction_amount) payload.late_deduction_amount = parseFloat(form.late_deduction_amount);

    console.log('Payload:', payload);

    if (editId) {
      const { error, data } = await supabase.from("staff").update(payload).eq("id", editId).select();
      console.log('Update result:', { error, data });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Staff updated" });
        setOpen(false);
        setEditId(null);
        setForm({ name: "", email: "", phone: "", position: "", salary: "", payment_date: "", payment_cycle: "monthly", include_weekends: false, late_deduction_amount: "", auto_deduct_late: false });
        fetchStaff();
      }
    } else {
      const { error, data } = await supabase.from("staff").insert(payload).select();
      console.log('Insert result:', { error, data });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Staff added" });
        setOpen(false);
        setForm({ name: "", email: "", phone: "", position: "", salary: "", payment_date: "", payment_cycle: "monthly", include_weekends: false, late_deduction_amount: "", auto_deduct_late: false });
        fetchStaff();
        syncStaff();
      }
    }
  };

  const handleEdit = (member: any) => {
    setEditId(member.id);
    setForm({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      position: member.position || "",
      salary: member.salary || "",
      payment_date: member.payment_date || "",
      payment_cycle: member.payment_cycle || "monthly",
      include_weekends: member.include_weekends || false,
      late_deduction_amount: member.late_deduction_amount || "",
      auto_deduct_late: member.auto_deduct_late || false
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Staff deleted" });
      fetchStaff();
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("attendance").insert({
      user_id: user.id,
      staff_id: attendanceForm.staff_id,
      date: attendanceForm.date,
      check_in: attendanceForm.check_in || null,
      check_out: attendanceForm.check_out || null,
      status: attendanceForm.status
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Attendance recorded" });
      setAttendanceOpen(false);
      setAttendanceForm({ staff_id: "", date: "", check_in: "", check_out: "", status: "present" });
      fetchAttendance();
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error, data: newPayment } = await supabase.from("salary_payments").insert({
      user_id: user.id,
      staff_id: paymentForm.staff_id,
      amount: parseFloat(paymentForm.amount),
      month: paymentForm.month,
      status: paymentForm.status,
      paid_date: paymentForm.paid_date || null
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Auto-record in cash book if paid
      if (paymentForm.status === "paid") {
        try {
          const selectedStaff = staff.find(s => s.id === paymentForm.staff_id);
          await recordSalaryPayment(
            user.id, 
            newPayment.id, 
            selectedStaff?.name || "Staff", 
            parseFloat(paymentForm.amount),
            paymentForm.paid_date ? new Date(paymentForm.paid_date) : new Date()
          );
          toast({ title: "Success", description: "Payment recorded and added to cash book" });
          
          const paymentCalc = calculatePaymentDue(selectedStaff);
          const stats = getStaffStats(selectedStaff.id);
          await generateSalaryReceipt(selectedStaff, newPayment, profile, paymentCalc, stats, toast);
        } catch (err) {
          console.error("Failed to record in cash book:", err);
          toast({ title: "Success", description: "Payment recorded (cash book entry failed)" });
        }
      } else {
        toast({ title: "Success", description: "Payment recorded" });
      }
      
      setPaymentOpen(false);
      setPaymentForm({ staff_id: "", amount: "", month: "", status: "pending", paid_date: "" });
      fetchPayments();
    }
  };

  const calculatePaymentDue = (member: any) => {
    const salary = parseFloat(member.salary) || 0;
    const cycle = member.payment_cycle || "monthly";
    const includeWeekends = member.include_weekends || false;
    
    const staffAttendance = attendance.filter(a => a.staff_id === member.id && a.status === "present");
    const lateDays = attendance.filter(a => a.staff_id === member.id && a.status === "late").length;
    
    let workingDays = 0;
    if (cycle === "daily") workingDays = 1;
    else if (cycle === "weekly") workingDays = includeWeekends ? 7 : 5;
    else if (cycle === "biweekly") workingDays = includeWeekends ? 14 : 10;
    else workingDays = includeWeekends ? 30 : 22;
    
    const dailyRate = salary / workingDays;
    const earnedAmount = staffAttendance.length * dailyRate;
    
    let deductions = 0;
    if (member.auto_deduct_late && lateDays > 0) {
      deductions = lateDays * (parseFloat(member.late_deduction_amount) || 0);
    }
    
    return { earnedAmount, deductions, paymentDue: earnedAmount - deductions, dailyRate, workingDays };
  };

  const getStaffStats = (staffId: string) => {
    const staffAttendance = attendance.filter(a => a.staff_id === staffId);
    const staffPayments = payments.filter(p => p.staff_id === staffId);
    const daysPresent = staffAttendance.filter(a => a.status === "present").length;
    const daysAbsent = staffAttendance.filter(a => a.status === "absent").length;
    const daysLate = staffAttendance.filter(a => a.status === "late").length;
    const totalPending = staffPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalPaid = staffPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return { daysPresent, daysAbsent, daysLate, totalPending, totalPaid, staffAttendance, staffPayments };
  };

  const getFilteredAttendance = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    return attendance.filter(a => {
      const staffMember = staff.find(s => s.id === a.staff_id);
      if (attendanceStaffSearch && staffMember && !staffMember.name.toLowerCase().includes(attendanceStaffSearch.toLowerCase())) return false;
      if (attendanceStaffFilter && attendanceStaffFilter !== "all" && a.staff_id !== attendanceStaffFilter) return false;
      if (attendanceFilter === "today") return a.date === today;
      if (attendanceFilter === "week") return a.date >= weekAgo;
      if (attendanceFilter === "month") return a.date >= monthStart;
      if (attendanceFilter === "custom") {
        if (attendanceStartDate && a.date < attendanceStartDate) return false;
        if (attendanceEndDate && a.date > attendanceEndDate) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.check_in || '').localeCompare(a.check_in || '');
    });
  };

  const getFilteredPayments = () => {
    return payments.filter(p => {
      if (paymentFilter === "pending" && p.status !== "pending") return false;
      if (paymentFilter === "paid" && p.status !== "paid") return false;
      if (paymentStaffFilter && p.staff_id !== paymentStaffFilter) return false;
      if (paymentStartDate && p.month < paymentStartDate) return false;
      if (paymentEndDate && p.month > paymentEndDate) return false;
      return true;
    });
  };

  const downloadAttendanceCSV = () => {
    const filtered = getFilteredAttendance();
    const csv = [
      ['Staff', 'Date', 'Check In', 'Check Out', 'Status'],
      ...filtered.map(a => {
        const staffMember = staff.find(s => s.id === a.staff_id);
        return [staffMember?.name || 'N/A', a.date, a.check_in || 'N/A', a.check_out || 'N/A', a.status];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "Success", description: "Attendance downloaded" });
  };

  const downloadPaymentsCSV = () => {
    const filtered = getFilteredPayments();
    const csv = [
      ['Staff', 'Amount', 'Month', 'Status', 'Paid Date'],
      ...filtered.map(p => {
        const staffMember = staff.find(s => s.id === p.staff_id);
        return [staffMember?.name || 'N/A', parseFloat(p.amount).toFixed(2), p.month, p.status, p.paid_date || 'N/A'];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "Success", description: "Payments downloaded" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant={activeTab === "staff" ? "default" : "outline"} onClick={() => setActiveTab("staff")}>Staff</Button>
          <Button variant={activeTab === "list" ? "default" : "outline"} onClick={() => setActiveTab("list")}>Staff List</Button>
        </div>
      </div>

      {activeTab === "list" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {staffList.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{member.name}</td>
                  <td className="px-4 py-3 text-foreground">{member.email || "N/A"}</td>
                  <td className="px-4 py-3 text-foreground">{member.phone || "N/A"}</td>
                  <td className="px-4 py-3 text-foreground">{member.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "staff" && (
        <div className="flex gap-2">
          <Dialog open={attendanceViewOpen} onOpenChange={setAttendanceViewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">View Attendance</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Attendance Records</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button variant={attendanceFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setAttendanceFilter("all")}>All Time</Button>
                  <Button variant={attendanceFilter === "today" ? "default" : "outline"} size="sm" onClick={() => setAttendanceFilter("today")}>Today</Button>
                  <Button variant={attendanceFilter === "week" ? "default" : "outline"} size="sm" onClick={() => setAttendanceFilter("week")}>Last 7 Days</Button>
                  <Button variant={attendanceFilter === "month" ? "default" : "outline"} size="sm" onClick={() => setAttendanceFilter("month")}>This Month</Button>
                  <Button variant={attendanceFilter === "custom" ? "default" : "outline"} size="sm" onClick={() => setAttendanceFilter("custom")}>Custom Range</Button>
                  <Button variant="outline" size="sm" onClick={downloadAttendanceCSV}>Download CSV</Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Search Staff</Label>
                    <Input 
                      placeholder="Search by name..." 
                      value={attendanceStaffSearch} 
                      onChange={(e) => setAttendanceStaffSearch(e.target.value)} 
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Staff</Label>
                    <Select value={attendanceStaffFilter} onValueChange={setAttendanceStaffFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {attendanceFilter === "custom" && (
                  <div className="flex gap-2">
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={attendanceStartDate} onChange={(e) => setAttendanceStartDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="date" value={attendanceEndDate} onChange={(e) => setAttendanceEndDate(e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Staff</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Check In</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Check Out</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {getFilteredAttendance().map((record) => {
                        const staffMember = staff.find(s => s.id === record.staff_id);
                        return (
                          <tr key={record.id}>
                            <td className="px-4 py-2 text-sm text-foreground">{staffMember?.name || "Unknown Staff"}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{record.date}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{record.check_in || "N/A"}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{record.check_out || "N/A"}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                record.status === "present" ? "bg-green-100 text-green-800" :
                                record.status === "late" ? "bg-yellow-100 text-yellow-800" :
                                record.status === "leave" ? "bg-blue-100 text-blue-800" :
                                "bg-red-100 text-red-800"
                              }`}>{record.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={paymentsViewOpen} onOpenChange={setPaymentsViewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">View Payments</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Salary Payments</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button variant={paymentFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setPaymentFilter("all")}>All</Button>
                  <Button variant={paymentFilter === "pending" ? "default" : "outline"} size="sm" onClick={() => setPaymentFilter("pending")}>Pending</Button>
                  <Button variant={paymentFilter === "paid" ? "default" : "outline"} size="sm" onClick={() => setPaymentFilter("paid")}>Paid</Button>
                  <Button variant="outline" size="sm" onClick={downloadPaymentsCSV}>Download CSV</Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Filter by Staff</Label>
                    <Select value={paymentStaffFilter || "all"} onValueChange={(v) => setPaymentStaffFilter(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Month</Label>
                    <Input type="month" value={paymentStartDate} onChange={(e) => setPaymentStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>End Month</Label>
                    <Input type="month" value={paymentEndDate} onChange={(e) => setPaymentEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Staff</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Month</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Paid Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {getFilteredPayments().map((payment) => {
                        const staffMember = staff.find(s => s.id === payment.staff_id);
                        return (
                          <tr key={payment.id}>
                            <td className="px-4 py-2 text-sm text-foreground">{staffMember?.name || "N/A"}</td>
                            <td className="px-4 py-2 text-sm font-semibold text-foreground">{formatAmount(0).replace("0.00", "")}{parseFloat(payment.amount).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-foreground">{payment.month}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${payment.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-foreground">{payment.paid_date || "N/A"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Record Attendance</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Attendance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                <div>
                  <Label>Staff Member *</Label>
                  <Select value={attendanceForm.staff_id} onValueChange={(v) => setAttendanceForm({ ...attendanceForm, staff_id: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} required />
                </div>
                <div>
                  <Label>Check In</Label>
                  <Input type="time" value={attendanceForm.check_in} onChange={(e) => setAttendanceForm({ ...attendanceForm, check_in: e.target.value })} />
                </div>
                <div>
                  <Label>Check Out</Label>
                  <Input type="time" value={attendanceForm.check_out} onChange={(e) => setAttendanceForm({ ...attendanceForm, check_out: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={attendanceForm.status} onValueChange={(v) => setAttendanceForm({ ...attendanceForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Record</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Salary Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <Label>Staff Member *</Label>
                  <Input 
                    placeholder="Search staff..." 
                    value={staffSearch} 
                    onChange={(e) => setStaffSearch(e.target.value)} 
                    className="mb-2"
                  />
                  <Select value={paymentForm.staff_id} onValueChange={(v) => setPaymentForm({ ...paymentForm, staff_id: v })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.filter(s => s.name.toLowerCase().includes(staffSearch.toLowerCase())).map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {formatAmount(0).replace("0.00", "")}{s.salary || 0}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount *</Label>
                  <Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                </div>
                <div>
                  <Label>Month *</Label>
                  <Input type="month" value={paymentForm.month} onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })} required />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({ ...paymentForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentForm.status === "paid" && (
                  <div>
                    <Label>Paid Date</Label>
                    <Input type="date" value={paymentForm.paid_date} onChange={(e) => setPaymentForm({ ...paymentForm, paid_date: e.target.value })} />
                  </div>
                )}
                <Button type="submit" className="w-full">Record Payment</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm({ name: "", email: "", phone: "", position: "", salary: "", payment_date: "", payment_cycle: "monthly", include_weekends: false, late_deduction_amount: "", auto_deduct_late: false }); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Staff" : "Add Staff"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Position</Label>
                    <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="mt-1.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Salary (Total Amount)</Label>
                    <Input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Cycle</Label>
                    <Select value={form.payment_cycle} onValueChange={(v) => setForm({ ...form, payment_cycle: v })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly (7 days)</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly (14 days)</SelectItem>
                        <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                  <input type="checkbox" id="weekends" checked={form.include_weekends} onChange={(e) => setForm({ ...form, include_weekends: e.target.checked })} className="w-4 h-4" />
                  <Label htmlFor="weekends" className="cursor-pointer text-sm">Include weekends in payment calculation</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Late Deduction Amount (per day)</Label>
                    <Input type="number" step="0.01" value={form.late_deduction_amount} onChange={(e) => setForm({ ...form, late_deduction_amount: e.target.value })} placeholder="Amount to deduct when late" className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Next Payment Date</Label>
                    <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} className="mt-1.5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                  <input type="checkbox" id="auto_deduct" checked={form.auto_deduct_late} onChange={(e) => setForm({ ...form, auto_deduct_late: e.target.checked })} className="w-4 h-4" />
                  <Label htmlFor="auto_deduct" className="cursor-pointer text-sm">Automatically deduct for late arrivals</Label>
                </div>
                <Button type="submit" className="w-full mt-6">{editId ? "Update" : "Add"} Staff</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === "staff" && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Position</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Salary</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Days Worked</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                <div className="flex items-center gap-1">
                  Payment Due
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Calculated amount based on days worked, daily rate, and deductions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                <div className="flex items-center gap-1">
                  Pending
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Total amount of payments recorded but not yet marked as paid</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {staff.map((member) => {
              const stats = getStaffStats(member.id);
              const payment = calculatePaymentDue(member);
              const isExpanded = expandedStaff === member.id;
              return (
                <>
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <button onClick={() => setExpandedStaff(isExpanded ? null : member.id)} className="flex items-center gap-2 font-medium text-foreground">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {member.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground">{member.position || "N/A"}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatAmount(0).replace("0.00", "")}{member.salary ? parseFloat(member.salary).toFixed(2) : "0.00"}</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">{stats.daysPresent}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{formatAmount(0).replace("0.00", "")}{payment.paymentDue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-yellow-600 dark:text-yellow-400">{formatAmount(0).replace("0.00", "")}{stats.totalPending.toFixed(2)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-gray-50 dark:bg-gray-700">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-2 text-foreground">Contact Info</h3>
                            <p className="text-sm text-foreground">Email: {member.email || "N/A"}</p>
                            <p className="text-sm text-foreground">Phone: {member.phone || "N/A"}</p>
                            <p className="text-sm text-foreground">Next Payment: {member.payment_date ? new Date(member.payment_date).toLocaleDateString() : "N/A"}</p>
                            <h3 className="font-semibold mt-4 mb-2 text-foreground">Payment Calculation</h3>
                            <p className="text-sm text-foreground">Cycle: {member.payment_cycle || "monthly"} | Weekends: {member.include_weekends ? "Included" : "Excluded"}</p>
                            <p className="text-sm text-foreground">Daily Rate: {formatAmount(0).replace("0.00", "")}{payment.dailyRate.toFixed(2)} | Working Days: {payment.workingDays}</p>
                            <p className="text-sm text-foreground">Earned: {formatAmount(0).replace("0.00", "")}{payment.earnedAmount.toFixed(2)} | Deductions: {formatAmount(0).replace("0.00", "")}{payment.deductions.toFixed(2)}</p>
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Payment Due: {formatAmount(0).replace("0.00", "")}{payment.paymentDue.toFixed(2)}</p>
                            <h3 className="font-semibold mt-4 mb-2 text-foreground">Attendance Summary</h3>
                            <p className="text-sm text-foreground">Present: {stats.daysPresent} | Absent: {stats.daysAbsent} | Late: {stats.daysLate}</p>
                            <h3 className="font-semibold mt-4 mb-2 text-foreground">Salary Summary</h3>
                            <p className="text-sm text-foreground">Pending: {formatAmount(0).replace("0.00", "")}{stats.totalPending.toFixed(2)} | Paid: {formatAmount(0).replace("0.00", "")}{stats.totalPaid.toFixed(2)}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2 text-foreground">Recent Attendance</h3>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {stats.staffAttendance.slice(0, 5).map((a: any, idx: number) => (
                                <div key={a.id || idx} className="text-sm flex justify-between text-foreground">
                                  <span>{a.date}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    a.status === "present" ? "bg-green-100 text-green-800" :
                                    a.status === "late" ? "bg-yellow-100 text-yellow-800" :
                                    a.status === "leave" ? "bg-blue-100 text-blue-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>{a.status}</span>
                                </div>
                              ))}
                            </div>
                            <h3 className="font-semibold mt-4 mb-2 text-foreground">Recent Payments</h3>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {stats.staffPayments.slice(0, 5).map((p: any, idx: number) => (
                                <div key={p.id || idx} className="text-sm flex justify-between text-foreground">
                                  <span>{p.month}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${p.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                    {formatAmount(0).replace("0.00", "")}{parseFloat(p.amount).toFixed(2)} - {p.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      </div>
    </div>
  );
}
