import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap } from "lucide-react";

export default function CRMEmailTriggers() {
  const { toast } = useToast();
  const [triggers, setTriggers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    loadTriggers();
  }, []);

  const loadTriggers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("crm_email_triggers").select("*").eq("user_id", user.id);
    if (data) setTriggers(data);
  };

  const saveTrigger = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("crm_email_triggers").insert({
      user_id: user.id,
      name: editing.name,
      trigger_type: editing.triggerType,
      trigger_conditions: editing.conditions
    });

    toast({ title: "Success", description: "Trigger created" });
    setEditing(null);
    loadTriggers();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM Email Triggers</h1>
        <Button onClick={() => setEditing({ name: "", triggerType: "customer_segment", conditions: {} })}>
          <Plus className="w-4 h-4 mr-1" />New Trigger
        </Button>
      </div>

      {editing && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Create Trigger</h3>
          <Input placeholder="Trigger Name" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
          <Select value={editing.triggerType} onValueChange={v => setEditing({...editing, triggerType: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="customer_segment">Customer Segment</SelectItem>
              <SelectItem value="purchase">After Purchase</SelectItem>
              <SelectItem value="inactivity">Inactivity Period</SelectItem>
              <SelectItem value="milestone">Customer Milestone</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={saveTrigger}>Save Trigger</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {triggers.map(t => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.trigger_type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                {t.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
