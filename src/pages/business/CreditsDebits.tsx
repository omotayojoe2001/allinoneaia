import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreditsDebits() {
  const [records, setRecords] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", type: "credit", amount: "", description: "", due_date: "", status: "pending" });
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
  }, []);

  const fetchRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("credits_debits").select("*, customers(name)").eq("user_id", user.id).order("created_at", { ascending: false });
    setRecords(data || []);
  };

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("customers").select("*").eq("user_id", user.id);
    setCustomers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("credits_debits").insert({
      user_id: user.id,
      customer_id: form.customer_id || null,
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      due_date: form.due_date || null,
      status: form.status
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Record added" });
      setOpen(false);
      setForm({ customer_id: "", type: "credit", amount: "", description: "", due_date: "", status: "pending" });
      fetchRecords();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("credits_debits").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Record deleted" });
      fetchRecords();
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "settled" : "pending";
    const { error } = await supabase.from("credits_debits").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchRecords();
    }
  };

  const totalCredit = records.filter(r => r.type === "credit" && r.status === "pending").reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalDebit = records.filter(r => r.type === "debit" && r.status === "pending").reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
      <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Credits & Debits</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credit/Debit Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Customer</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Money Owed to You)</SelectItem>
                    <SelectItem value="debit">Debit (Money You Owe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Add Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Credits (Pending)</p>
          <p className="text-2xl font-bold text-green-600">${totalCredit.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Debits (Pending)</p>
          <p className="text-2xl font-bold text-red-600">${totalDebit.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3">{record.customers?.name || "N/A"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${record.type === "credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {record.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">${parseFloat(record.amount).toFixed(2)}</td>
                <td className="px-4 py-3">{record.description}</td>
                <td className="px-4 py-3">{record.due_date || "N/A"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(record.id, record.status)} className={`px-2 py-1 rounded text-xs ${record.status === "settled" ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {record.status}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
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
