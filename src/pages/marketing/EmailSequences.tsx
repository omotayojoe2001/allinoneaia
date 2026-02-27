import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, Pause } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function EmailSequences() {
  const { toast } = useToast();
  const [sequences, setSequences] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [steps, setSteps] = useState([{ stepNumber: 1, delayDays: 0, subject: "", body: "" }]);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("email_sequences").select("*").eq("user_id", user.id);
    if (data) setSequences(data);
  };

  const saveSequence = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: seq, error } = await supabase.from("email_sequences").insert({
      user_id: user.id,
      name: editing.name,
      type: editing.type,
      trigger_event: editing.triggerEvent
    }).select().single();

    if (error || !seq) {
      toast({ title: "Error", description: "Failed to save sequence", variant: "destructive" });
      return;
    }

    await supabase.from("email_sequence_steps").insert(
      steps.map(s => ({
        sequence_id: seq.id,
        step_number: s.stepNumber,
        delay_days: s.delayDays,
        subject: s.subject,
        body: s.body
      }))
    );

    toast({ title: "Success", description: "Sequence created" });
    setEditing(null);
    loadSequences();
  };

  const toggleStatus = async (id: string, status: string) => {
    await supabase.from("email_sequences").update({ status: status === "active" ? "paused" : "active" }).eq("id", id);
    loadSequences();
  };

  const addStep = () => setSteps([...steps, { stepNumber: steps.length + 1, delayDays: 0, subject: "", body: "" }]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Sequences</h1>
        <Button onClick={() => setEditing({ name: "", type: "drip", triggerEvent: "" })}>
          <Plus className="w-4 h-4 mr-1" />New Sequence
        </Button>
      </div>

      {editing && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Create Sequence</h3>
          <Input placeholder="Sequence Name" value={editing.name} 
            onChange={e => setEditing({...editing, name: e.target.value})} />
          <Select value={editing.type} onValueChange={v => setEditing({...editing, type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="drip">Drip Campaign</SelectItem>
              <SelectItem value="welcome">Welcome Series</SelectItem>
              <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
              <SelectItem value="re_engagement">Re-engagement</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Trigger Event" value={editing.triggerEvent}
            onChange={e => setEditing({...editing, triggerEvent: e.target.value})} />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Email Steps</h4>
              <Button size="sm" variant="outline" onClick={addStep}>Add Step</Button>
            </div>
            {steps.map((step, idx) => (
              <Card key={idx} className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Step {step.stepNumber}</p>
                  {idx > 0 && <Button size="sm" variant="ghost" onClick={() => setSteps(steps.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>}
                </div>
                <Input type="number" placeholder="Delay (days)" value={step.delayDays}
                  onChange={e => { const s = [...steps]; s[idx].delayDays = parseInt(e.target.value); setSteps(s); }} />
                <Input placeholder="Subject" value={step.subject}
                  onChange={e => { const s = [...steps]; s[idx].subject = e.target.value; setSteps(s); }} />
                <Textarea placeholder="Email Body" value={step.body}
                  onChange={e => { const s = [...steps]; s[idx].body = e.target.value; setSteps(s); }} />
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSequence}>Save Sequence</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {sequences.map(seq => (
          <Card key={seq.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{seq.name}</p>
                <p className="text-sm text-muted-foreground">{seq.type}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleStatus(seq.id, seq.status)}>
                {seq.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
