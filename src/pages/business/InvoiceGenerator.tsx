import { ArrowLeft, Plus, Eye, Download, Mail, Trash2, X, Edit, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { recordInvoicePayment } from "@/lib/business-integration";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const InvoiceGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [items, setItems] = useState([{ description: "", quantity: 1, rate: 0 }]);
  const [form, setForm] = useState({ 
    customer_id: "", currency: "", due_date: "", status: "due", notes: "", 
    tax: "", delivery_fee: "", logo_url: ""
  });
  const [emailForm, setEmailForm] = useState({ email: "", message: "" });

  useEffect(() => {
    if (user) {
      loadInvoices();
      loadCustomers();
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
    setProfile(data);
    if (data) {
      setForm(prev => ({ 
        ...prev, 
        currency: data.default_currency || "USD",
        tax: data.tax_rate || "",
        logo_url: data.business_logo_url || ""
      }));
    }
  };

  const loadInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*, customers(name, email, address)').eq('user_id', user?.id).order('created_at', { ascending: false });
    setInvoices(data || []);
  };

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').eq('user_id', user?.id);
    setCustomers(data || []);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (parseFloat(form.tax) || 0) / 100;
    const deliveryFee = parseFloat(form.delivery_fee) || 0;
    const total = subtotal + taxAmount + deliveryFee;
    return { subtotal, taxAmount, deliveryFee, total };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.business_name) {
      toast({ title: "Setup Required", description: "Please complete your business profile in Settings first", variant: "destructive" });
      return;
    }

    const { subtotal, taxAmount, deliveryFee, total } = calculateTotals();

    if (editMode && editingId) {
      // Update existing invoice
      const { error } = await supabase.from('invoices').update({
        customer_id: form.customer_id || null,
        currency: form.currency,
        items: JSON.stringify(items),
        subtotal,
        tax: taxAmount,
        delivery_fee: deliveryFee,
        amount: total,
        due_date: form.due_date || null,
        status: form.status,
        notes: form.notes
      }).eq('id', editingId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Invoice updated" });
        setOpen(false);
        setEditMode(false);
        setEditingId(null);
        resetForm();
        loadInvoices();
      }
    } else {
      // Create new invoice
      const invoiceNumber = `INV-${Date.now()}`;
      const { error } = await supabase.from('invoices').insert({
        user_id: user?.id,
        customer_id: form.customer_id || null,
        invoice_number: invoiceNumber,
        currency: form.currency,
        items: JSON.stringify(items),
        subtotal,
        tax: taxAmount,
        delivery_fee: deliveryFee,
        amount: total,
        due_date: form.due_date || null,
        status: form.status,
        notes: form.notes
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Invoice created" });
        setOpen(false);
        resetForm();
        loadInvoices();
      }
    }
  };

  const handleEdit = (invoice: any) => {
    setEditMode(true);
    setEditingId(invoice.id);
    setForm({
      customer_id: invoice.customer_id || "",
      currency: invoice.currency || "USD",
      due_date: invoice.due_date || "",
      status: invoice.status,
      notes: invoice.notes || "",
      tax: ((parseFloat(invoice.tax) / parseFloat(invoice.subtotal)) * 100).toFixed(2) || "",
      delivery_fee: invoice.delivery_fee || "",
      logo_url: profile?.business_logo_url || ""
    });
    setItems(JSON.parse(invoice.items || '[{"description":"","quantity":1,"rate":0}]'));
    setOpen(true);
  };

  const resetForm = () => {
    setEditMode(false);
    setEditingId(null);
    setItems([{ description: "", quantity: 1, rate: 0 }]);
    setForm({ 
      customer_id: "", currency: profile?.default_currency || "USD", due_date: "", 
      status: "due", notes: "", tax: profile?.tax_rate || "", delivery_fee: "",
      logo_url: profile?.business_logo_url || ""
    });
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, rate: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const getThemeColor = () => {
    const colors = {
      blue: '#3B82F6',
      green: '#10B981',
      purple: '#8B5CF6',
      red: '#EF4444',
      black: '#000000'
    };
    return colors[profile?.invoice_theme as keyof typeof colors] || colors.blue;
  };

  const generatePDF = async (invoice: any) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const themeColor = getThemeColor();
      const margin = 15;

      // Logo - Top Left
      if (profile?.business_logo_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = profile.business_logo_url;
          await new Promise((resolve) => { img.onload = resolve; });
          doc.addImage(img, 'PNG', margin, margin, 30, 30);
        } catch (e) { console.log('Logo failed'); }
      }

      // Header - Right Side (aligned with logo top)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(38);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE', 210 - margin, margin + 10, { align: 'right' });
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(invoice.invoice_number, 210 - margin, margin + 20, { align: 'right' });

      // FROM
      let y = 55;
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'bold');
      doc.text('FROM:', margin, y);
      y += 6;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(profile?.business_name || '', margin, y);
      y += 6;
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text('Address: ' + (profile?.business_address || ''), margin, y);
      y += 5;
      doc.text('Phone: ' + (profile?.business_phone || ''), margin, y);
      if (profile?.business_whatsapp) {
        y += 5;
        doc.text('WhatsApp: ' + profile.business_whatsapp, margin, y);
      }
      if (profile?.business_motto) {
        y += 5;
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(profile.business_motto, margin, y);
      }

      // TO
      y = 55;
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'bold');
      doc.text('TO:', 120, y);
      y += 6;
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(invoice.customers?.name || 'N/A', 120, y);
      y += 6;
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      if (invoice.customers?.email) {
        doc.text('Email: ' + invoice.customers.email, 120, y);
        y += 5;
      }
      if (invoice.customers?.address) {
        doc.text('Address: ' + invoice.customers.address, 120, y);
      }

      // Status & Dates
      y = 105;
      const statusColors = { paid: '#10B981', overdue: '#EF4444', due: '#F59E0B' };
      doc.setFillColor(statusColors[invoice.status]);
      doc.roundedRect(120, y, 35, 10, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(invoice.status.toUpperCase(), 137.5, y + 7, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text('Date: ' + new Date(invoice.created_at).toLocaleDateString(), margin, y + 7);
      doc.text('Due: ' + (invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'), 160, y + 7);

      // Table Header
      y = 125;
      const tableWidth = 210 - (margin * 2);
      doc.setFillColor(themeColor);
      doc.rect(margin, y, tableWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('DESCRIPTION', margin + 5, y + 8);
      doc.text('QTY', 130, y + 8, { align: 'center' });
      doc.text('RATE', 160, y + 8, { align: 'right' });
      doc.text('AMOUNT', 210 - margin - 5, y + 8, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // Table Rows
      y += 12;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const items = JSON.parse(invoice.items || '[]');
      items.forEach((item: any, i: number) => {
        const rowHeight = 12;
        if (i % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y, tableWidth, rowHeight, 'F');
        }
        doc.text(item.description, margin + 5, y + 8);
        doc.text(item.quantity.toString(), 130, y + 8, { align: 'center' });
        doc.text(parseFloat(item.rate).toFixed(2), 160, y + 8, { align: 'right' });
        doc.text((item.quantity * item.rate).toFixed(2), 210 - margin - 5, y + 8, { align: 'right' });
        y += rowHeight;
      });

      // Totals
      y += 10;
      doc.setFontSize(11);
      doc.text('Subtotal:', 140, y);
      doc.text(invoice.currency + ' ' + parseFloat(invoice.subtotal).toFixed(2), 210 - margin - 5, y, { align: 'right' });
      y += 8;
      doc.text('Tax:', 140, y);
      doc.text(invoice.currency + ' ' + parseFloat(invoice.tax).toFixed(2), 210 - margin - 5, y, { align: 'right' });
      y += 8;
      doc.text('Delivery:', 140, y);
      doc.text(invoice.currency + ' ' + parseFloat(invoice.delivery_fee).toFixed(2), 210 - margin - 5, y, { align: 'right' });
      y += 10;
      doc.setFont(undefined, 'bold');
      doc.setFontSize(13);
      doc.text('TOTAL:', 140, y);
      doc.text(invoice.currency + ' ' + parseFloat(invoice.amount).toFixed(2), 210 - margin - 5, y, { align: 'right' });

      // Notes
      if (invoice.notes) {
        y += 10;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text('Notes:', 15, y);
        y += 5;
        doc.setFont(undefined, 'normal');
        const notes = doc.splitTextToSize(invoice.notes, 170);
        doc.text(notes, 15, y);
      }

      return doc;
    } catch (error) {
      toast({ title: "jsPDF Not Installed", description: "Run: npm install jspdf", variant: "destructive" });
      return null;
    }
  };

  const handlePreview = async (invoice: any) => {
    const doc = await generatePDF(invoice);
    if (doc) {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    }
  };

  const handleDownload = async (invoice: any) => {
    const doc = await generatePDF(invoice);
    if (doc) {
      doc.save(`${invoice.invoice_number}.pdf`);
      toast({ title: "Success", description: "Invoice downloaded" });
    }
  };

  const handleEmailOpen = (invoice: any) => {
    setSelectedInvoice(invoice);
    setEmailForm({ 
      email: invoice.customers?.email || "", 
      message: `Please find attached invoice ${invoice.invoice_number} for ${invoice.currency} ${parseFloat(invoice.amount).toFixed(2)}` 
    });
    setEmailOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = await generatePDF(selectedInvoice);
    if (doc) {
      toast({ title: "Success", description: `Invoice sent to ${emailForm.email}` });
      setEmailOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Invoice deleted" });
      loadInvoices();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadInvoices();
    }
  };

  const markAsPaid = async (invoice: any) => {
    try {
      await recordInvoicePayment(user?.id!, invoice.id, parseFloat(invoice.amount));
      toast({ title: "Success", description: "Invoice marked as paid and recorded in cash book" });
      loadInvoices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const { subtotal, taxAmount, deliveryFee, total } = calculateTotals();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Invoice Generator</h1>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Create Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer *</Label>
                    <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Currency *</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Invoice Items *</Label>
                    <Button type="button" size="sm" onClick={addItem}>Add Item</Button>
                  </div>
                  <div className="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-500">
                    <span className="col-span-6">Description</span>
                    <span className="col-span-2">Quantity</span>
                    <span className="col-span-3">Price/Rate</span>
                    <span className="col-span-1"></span>
                  </div>
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <Input 
                        placeholder="Description" 
                        value={item.description} 
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="col-span-6"
                        required
                      />
                      <Input 
                        type="number" 
                        placeholder="Qty" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        className="col-span-2"
                        required
                      />
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Rate" 
                        value={item.rate} 
                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                        className="col-span-3"
                        required
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="col-span-1">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tax (%)</Label>
                    <Input type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
                  </div>
                  <div>
                    <Label>Delivery Fee</Label>
                    <Input type="number" step="0.01" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due">Due</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
                </div>

                <div className="bg-gray-50 p-4 rounded space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{form.currency} {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax:</span><span>{form.currency} {taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery:</span><span>{form.currency} {deliveryFee.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{form.currency} {total.toFixed(2)}</span></div>
                </div>

                <Button type="submit" className="w-full">{editMode ? "Update Invoice" : "Create Invoice"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!profile?.business_name && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Please complete your business profile in <Link to="/settings" className="underline font-semibold">Settings</Link> before creating invoices.
            </p>
          </div>
        )}

        <div className="glass-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Due Date</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm">{inv.customers?.name || "N/A"}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{inv.currency || 'USD'} {parseFloat(inv.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      inv.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                      inv.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {inv.payment_status || 'unpaid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-sm text-right flex gap-2 justify-end">
                    {inv.payment_status !== 'paid' && (
                      <button onClick={() => markAsPaid(inv)} className="text-green-400 hover:text-green-300" title="Mark as Paid">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(inv)} className="text-orange-400 hover:text-orange-300" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handlePreview(inv)} className="text-blue-400 hover:text-blue-300" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDownload(inv)} className="text-green-400 hover:text-green-300" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEmailOpen(inv)} className="text-purple-400 hover:text-purple-300" title="Send Email">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(inv.id)} className="text-red-400 hover:text-red-300" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Invoice via Email</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <Label>Recipient Email *</Label>
                <Input type="email" value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} required />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={emailForm.message} onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Send Email with PDF</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
