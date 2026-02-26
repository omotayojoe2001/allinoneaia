import { useState, useEffect } from "react";
import { Bot, Plus, Trash2, Edit, ArrowLeft, Power, PowerOff } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WhatsAppChatbots = () => {
  const { platform } = useParams<{ platform: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bots, setBots] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    instructions: "",
    knowledge_base: "",
    model: "llama-3.3-70b-versatile",
    temperature: "0.7",
    is_active: true
  });

  useEffect(() => {
    if (user) fetchBots();
  }, [user]);

  const fetchBots = async () => {
    const { data } = await supabase
      .from('chatbots')
      .select('*')
      .eq('user_id', user?.id)
      .eq('platform', platform || 'whatsapp')
      .order('created_at', { ascending: false });
    setBots(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      user_id: user?.id,
      platform: platform || 'whatsapp',
      name: form.name,
      instructions: form.instructions,
      knowledge_base: form.knowledge_base,
      model: form.model,
      temperature: parseFloat(form.temperature),
      is_active: form.is_active
    };

    if (editId) {
      const { error } = await supabase.from('chatbots').update(payload).eq('id', editId);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Chatbot updated' });
        setOpen(false);
        resetForm();
        fetchBots();
      }
    } else {
      const { error } = await supabase.from('chatbots').insert(payload);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Chatbot created' });
        setOpen(false);
        resetForm();
        fetchBots();
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      instructions: "",
      knowledge_base: "",
      model: "llama-3.3-70b-versatile",
      temperature: "0.7",
      is_active: true
    });
  };

  const handleEdit = (bot: any) => {
    setEditId(bot.id);
    setForm({
      name: bot.name,
      instructions: bot.instructions || "",
      knowledge_base: bot.knowledge_base || "",
      model: bot.model || "llama-3.3-70b-versatile",
      temperature: bot.temperature?.toString() || "0.7",
      is_active: bot.is_active
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this chatbot?')) return;
    const { error } = await supabase.from('chatbots').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Chatbot deleted' });
      fetchBots();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('chatbots').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchBots();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{platform === 'telegram' ? 'Telegram' : platform === 'web' ? 'Web Widget' : 'WhatsApp'} Chatbots</h1>
            <p className="text-sm text-muted-foreground">AI-powered chatbots for {platform === 'telegram' ? 'Telegram' : platform === 'web' ? 'your website' : 'WhatsApp'}</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Chatbot</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit' : 'Create'} Chatbot</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Customer Support Bot" />
                </div>
                <div>
                  <Label>Instructions *</Label>
                  <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required placeholder="You are a helpful customer support assistant..." rows={4} />
                </div>
                <div>
                  <Label>Knowledge Base</Label>
                  <Textarea value={form.knowledge_base} onChange={(e) => setForm({ ...form, knowledge_base: e.target.value })} placeholder="Business hours: 9AM-6PM\nProducts: ...\nPolicies: ..." rows={6} />
                </div>
                <div>
                  <Label>AI Model</Label>
                  <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Recommended)</SelectItem>
                      <SelectItem value="llama-3.1-70b-versatile">Llama 3.1 70B</SelectItem>
                      <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Temperature (0-1)</Label>
                  <Input type="number" step="0.1" min="0" max="1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Lower = more focused, Higher = more creative</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" />
                  <Label>Active (responds to messages)</Label>
                </div>
                <Button type="submit" className="w-full">{editId ? 'Update' : 'Create'} Chatbot</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {bots.length === 0 ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No chatbots yet</p>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Your First Chatbot</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map((bot) => (
              <div key={bot.id} className="glass-card rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{bot.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{bot.instructions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(bot.id, bot.is_active)} className={`p-2 rounded-lg ${bot.is_active ? 'bg-green-500/15 text-green-500' : 'bg-secondary text-muted-foreground'}`} title={bot.is_active ? 'Active' : 'Inactive'}>
                    {bot.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(bot)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(bot.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppChatbots;
