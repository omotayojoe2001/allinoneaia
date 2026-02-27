import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function UnsubscribeManagement() {
  const { toast } = useToast();
  const [unsubscribes, setUnsubscribes] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState({ marketing: true, transactional: true, newsletter: true });

  useEffect(() => {
    loadUnsubscribes();
  }, []);

  const loadUnsubscribes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("email_unsubscribes").select("*").eq("user_id", user.id).order("unsubscribed_at", { ascending: false });
    if (data) setUnsubscribes(data);
  };

  const addUnsubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !email) return;

    await supabase.from("email_unsubscribes").insert({
      user_id: user.id,
      email,
      preferences
    });

    toast({ title: "Success", description: "Email unsubscribed" });
    setEmail("");
    loadUnsubscribes();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Unsubscribe Management</h1>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Add Unsubscribe</h3>
        <div className="flex gap-2">
          <Input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          <Button onClick={addUnsubscribe}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Default Preferences</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <Checkbox checked={preferences.marketing} onCheckedChange={v => setPreferences({...preferences, marketing: !!v})} />
              <span className="text-sm">Marketing</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={preferences.transactional} onCheckedChange={v => setPreferences({...preferences, transactional: !!v})} />
              <span className="text-sm">Transactional</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={preferences.newsletter} onCheckedChange={v => setPreferences({...preferences, newsletter: !!v})} />
              <span className="text-sm">Newsletter</span>
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Unsubscribed Contacts ({unsubscribes.length})</h3>
        <div className="space-y-2">
          {unsubscribes.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{u.email}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(u.unsubscribed_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
