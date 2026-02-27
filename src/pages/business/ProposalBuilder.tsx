import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Send, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function ProposalBuilder() {
  const { toast } = useToast();
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [formData, setFormData] = useState({
    clientName: "", clientEmail: "", title: "", validUntil: ""
  });

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const saveProposal = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const proposalNumber = `PROP-${Date.now()}`;
    const { data: proposal, error } = await supabase.from("proposals").insert({
      user_id: user.id,
      proposal_number: proposalNumber,
      client_name: formData.clientName,
      client_email: formData.clientEmail,
      title: formData.title,
      content: "",
      total_amount: total,
      status,
      valid_until: formData.validUntil,
      sent_at: status === "sent" ? new Date().toISOString() : null
    }).select().single();

    if (error || !proposal) {
      toast({ title: "Error", description: "Failed to save proposal", variant: "destructive" });
      return;
    }

    await supabase.from("proposal_line_items").insert(
      items.map(item => ({
        proposal_id: proposal.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.quantity * item.unitPrice
      }))
    );

    toast({ title: "Success", description: `Proposal ${status === "sent" ? "sent" : "saved"}` });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Proposal Builder</h1>
      
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Client Name" value={formData.clientName} 
            onChange={e => setFormData({...formData, clientName: e.target.value})} />
          <Input placeholder="Client Email" value={formData.clientEmail}
            onChange={e => setFormData({...formData, clientEmail: e.target.value})} />
          <Input placeholder="Proposal Title" value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})} />
          <Input type="date" placeholder="Valid Until" value={formData.validUntil}
            onChange={e => setFormData({...formData, validUntil: e.target.value})} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Line Items</h3>
            <Button size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" />Add Item</Button>
          </div>
          
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input placeholder="Description" value={item.description}
                onChange={e => updateItem(idx, "description", e.target.value)} className="flex-1" />
              <Input type="number" placeholder="Qty" value={item.quantity}
                onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value))} className="w-20" />
              <Input type="number" placeholder="Price" value={item.unitPrice}
                onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value))} className="w-32" />
              <div className="w-32 flex items-center">₦{(item.quantity * item.unitPrice).toLocaleString()}</div>
              <Button size="sm" variant="ghost" onClick={() => removeItem(idx)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xl font-bold">Total: ₦{total.toLocaleString()}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveProposal("draft")}>Save Draft</Button>
            <Button onClick={() => saveProposal("sent")}><Send className="w-4 h-4 mr-1" />Send Proposal</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
