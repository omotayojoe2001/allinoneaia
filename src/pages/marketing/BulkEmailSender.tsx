import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Send, Clock, CheckCircle, XCircle } from "lucide-react";

export default function BulkEmailSender() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("email_queue").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (data) setQueue(data);
  };

  const sendBulk = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const recipients = emails.split("\n").filter(e => e.trim());
    await supabase.from("email_queue").insert(
      recipients.map(email => ({
        user_id: user.id,
        recipient_email: email.trim(),
        subject,
        body,
        priority: 5
      }))
    );

    toast({ title: "Success", description: `${recipients.length} emails queued` });
    setEmails("");
    setSubject("");
    setBody("");
    loadQueue();
  };

  const stats = {
    pending: queue.filter(e => e.status === "pending").length,
    sent: queue.filter(e => e.status === "sent").length,
    failed: queue.filter(e => e.status === "failed").length
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Bulk Email Sender</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Send Bulk Email</h3>
        <Textarea placeholder="Email addresses (one per line)" value={emails} onChange={e => setEmails(e.target.value)} rows={5} />
        <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
        <Textarea placeholder="Email body" value={body} onChange={e => setBody(e.target.value)} rows={6} />
        <Button onClick={sendBulk}><Send className="w-4 h-4 mr-1" />Queue Emails</Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Email Queue</h3>
        <div className="space-y-2">
          {queue.slice(0, 10).map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{e.recipient_email}</p>
                <p className="text-sm text-muted-foreground">{e.subject}</p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                e.status === "sent" ? "bg-green-100 text-green-700" :
                e.status === "failed" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>{e.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
