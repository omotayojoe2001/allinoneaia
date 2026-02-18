import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, ArrowLeft, Upload } from "lucide-react";
import { Link } from "react-router-dom";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    name: "", email: "", phone: "", address: "", notes: "",
    amount_owed_to_us: "", amount_we_owe: "", owed_to_us_due_date: "", we_owe_due_date: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("customers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setCustomers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      notes: form.notes || null,
      amount_owed_to_us: form.amount_owed_to_us ? parseFloat(form.amount_owed_to_us) : 0,
      amount_we_owe: form.amount_we_owe ? parseFloat(form.amount_we_owe) : 0,
      owed_to_us_due_date: form.owed_to_us_due_date || null,
      we_owe_due_date: form.we_owe_due_date || null
    };

    if (editId) {
      const { error } = await supabase.from("customers").update(payload).eq("id", editId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Customer updated" });
        setOpen(false);
        setEditId(null);
        setForm({ name: "", email: "", phone: "", address: "", notes: "", amount_owed_to_us: "", amount_we_owe: "", owed_to_us_due_date: "", we_owe_due_date: "" });
        fetchCustomers();
      }
    } else {
      const { error } = await supabase.from("customers").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Customer added" });
        setOpen(false);
        setForm({ name: "", email: "", phone: "", address: "", notes: "", amount_owed_to_us: "", amount_we_owe: "", owed_to_us_due_date: "", we_owe_due_date: "" });
        fetchCustomers();
      }
    }
  };

  const handleEdit = (customer: any) => {
    setEditId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
      amount_owed_to_us: customer.amount_owed_to_us || "",
      amount_we_owe: customer.amount_we_owe || "",
      owed_to_us_due_date: customer.owed_to_us_due_date || "",
      we_owe_due_date: customer.we_owe_due_date || ""
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Customer deleted" });
      fetchCustomers();
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const customersToImport = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        user_id: user.id,
        name: values[0] || "",
        email: values[1] || null,
        phone: values[2] || null,
        address: values[3] || null,
        notes: values[4] || null,
        amount_owed_to_us: values[5] ? parseFloat(values[5]) : 0,
        amount_we_owe: values[6] ? parseFloat(values[6]) : 0,
        owed_to_us_due_date: values[7] || null,
        we_owe_due_date: values[8] || null
      };
    });

    const { error } = await supabase.from("customers").insert(customersToImport);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${customersToImport.length} customers imported` });
      fetchCustomers();
    }
    e.target.value = "";
  };

  const totalOwedToUs = customers.reduce((sum, c) => sum + (parseFloat(c.amount_owed_to_us) || 0), 0);
  const totalWeOwe = customers.reduce((sum, c) => sum + (parseFloat(c.amount_we_owe) || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
      <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <label htmlFor="csv-upload">
            <Button type="button" variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
              <Upload className="w-4 h-4 mr-2" />Import CSV
            </Button>
            <input id="csv-upload" type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm({ name: "", email: "", phone: "", address: "", notes: "", amount_owed_to_us: "", amount_we_owe: "", owed_to_us_due_date: "", we_owe_due_date: "" }); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Customer" : "Add Customer"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <Label>Amount Customer Owes Us</Label>
                  <Input type="number" step="0.01" value={form.amount_owed_to_us} onChange={(e) => setForm({ ...form, amount_owed_to_us: e.target.value })} />
                </div>
                <div>
                  <Label>Due Date (Customer Owes Us)</Label>
                  <Input type="date" value={form.owed_to_us_due_date} onChange={(e) => setForm({ ...form, owed_to_us_due_date: e.target.value })} />
                </div>
                <div>
                  <Label>Amount We Owe Customer</Label>
                  <Input type="number" step="0.01" value={form.amount_we_owe} onChange={(e) => setForm({ ...form, amount_we_owe: e.target.value })} />
                </div>
                <div>
                  <Label>Due Date (We Owe Customer)</Label>
                  <Input type="date" value={form.we_owe_due_date} onChange={(e) => setForm({ ...form, we_owe_due_date: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">{editId ? "Update" : "Add"} Customer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Owed to Us</p>
          <p className="text-2xl font-bold text-green-600">${totalOwedToUs.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total We Owe</p>
          <p className="text-2xl font-bold text-red-600">${totalWeOwe.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owes Us</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">We Owe</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3 font-medium">{customer.name}</td>
                <td className="px-4 py-3">{customer.email || "N/A"}</td>
                <td className="px-4 py-3">{customer.phone || "N/A"}</td>
                <td className="px-4 py-3 text-green-600 font-semibold">${parseFloat(customer.amount_owed_to_us || 0).toFixed(2)}</td>
                <td className="px-4 py-3">{customer.owed_to_us_due_date || "N/A"}</td>
                <td className="px-4 py-3 text-red-600 font-semibold">${parseFloat(customer.amount_we_owe || 0).toFixed(2)}</td>
                <td className="px-4 py-3">{customer.we_owe_due_date || "N/A"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">CSV Format: name, email, phone, address, notes, amount_owed_to_us, amount_we_owe, owed_to_us_due_date, we_owe_due_date</p>
      </div>
      </div>
    </div>
  );
}
