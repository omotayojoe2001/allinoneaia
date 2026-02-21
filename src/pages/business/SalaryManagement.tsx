import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function SalaryManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ staff_id: "", amount: "", month: "", status: "pending", paid_date: "" });
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchPayments();
    fetchStaff();
  }, []);

  const fetchPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("salary_payments").select("*, staff(name, salary)").eq("user_id", user.id).order("created_at", { ascending: false });
    setPayments(data || []);
  };

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("staff").select("*").eq("user_id", user.id);
    setStaff(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      staff_id: form.staff_id,
      amount: parseFloat(form.amount),
      month: form.month,
      status: form.status,
      paid_date: form.paid_date || null
    };

    if (editId) {
      const { error } = await supabase.from("salary_payments").update(payload).eq("id", editId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Payment updated" });
        setOpen(false);
        setEditId(null);
        setForm({ staff_id: "", amount: "", month: "", status: "pending", paid_date: "" });
        fetchPayments();
      }
    } else {
      const { error } = await supabase.from("salary_payments").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Payment recorded" });
        setOpen(false);
        setForm({ staff_id: "", amount: "", month: "", status: "pending", paid_date: "" });
        fetchPayments();
      }
    }
  };

  const handleEdit = (payment: any) => {
    setEditId(payment.id);
    setForm({
      staff_id: payment.staff_id,
      amount: payment.amount,
      month: payment.month,
      status: payment.status,
      paid_date: payment.paid_date || ""
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("salary_payments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Payment deleted" });
      fetchPayments();
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "paid" : "pending";
    const { error } = await supabase.from("salary_payments").update({ status: newStatus, paid_date: newStatus === "paid" ? new Date().toISOString().split("T")[0] : null }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchPayments();
    }
  };

  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
      <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Salary Management</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm({ staff_id: "", amount: "", month: "", status: "pending", paid_date: "" }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Payment" : "Add Payment"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Staff Member *</Label>
                <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {formatAmount(s.salary || 0)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <Label>Month *</Label>
                <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === "paid" && (
                <div>
                  <Label>Paid Date</Label>
                  <Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} />
                </div>
              )}
              <Button type="submit" className="w-full">{editId ? "Update" : "Add"} Payment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{formatAmount(totalPending)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatAmount(totalPaid)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 font-medium">{payment.staff?.name}</td>
                <td className="px-4 py-3 font-semibold">{formatAmount(parseFloat(payment.amount))}</td>
                <td className="px-4 py-3">{payment.month}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(payment.id, payment.status)} className={`px-2 py-1 rounded text-xs ${payment.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {payment.status}
                  </button>
                </td>
                <td className="px-4 py-3">{payment.paid_date || "N/A"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(payment)}>
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(payment.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
