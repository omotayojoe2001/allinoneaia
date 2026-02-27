import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Mail, MousePointer, AlertCircle, UserX } from "lucide-react";

export default function EmailAnalytics() {
  const [stats, setStats] = useState({ sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("email_analytics").select("*").eq("user_id", user.id);
    if (!data) return;

    setStats({
      sent: data.length,
      delivered: data.filter(e => e.delivered_at).length,
      opened: data.filter(e => e.opened_at).length,
      clicked: data.filter(e => e.clicked_at).length,
      bounced: data.filter(e => e.bounced_at).length,
      unsubscribed: data.filter(e => e.unsubscribed_at).length
    });

    const grouped = data.reduce((acc: any, email) => {
      const id = email.campaign_id || "direct";
      if (!acc[id]) acc[id] = { id, sent: 0, opened: 0, clicked: 0 };
      acc[id].sent++;
      if (email.opened_at) acc[id].opened++;
      if (email.clicked_at) acc[id].clicked++;
      return acc;
    }, {});

    setCampaigns(Object.values(grouped).map((c: any) => ({
      ...c,
      openRate: ((c.opened / c.sent) * 100).toFixed(1),
      clickRate: ((c.clicked / c.sent) * 100).toFixed(1)
    })));
  };

  const metrics = [
    { label: "Sent", value: stats.sent, icon: Mail, color: "text-blue-500" },
    { label: "Opened", value: stats.opened, icon: Mail, color: "text-purple-500", rate: ((stats.opened / stats.sent) * 100).toFixed(1) + "%" },
    { label: "Clicked", value: stats.clicked, icon: MousePointer, color: "text-orange-500", rate: ((stats.clicked / stats.sent) * 100).toFixed(1) + "%" },
    { label: "Bounced", value: stats.bounced, icon: AlertCircle, color: "text-red-500" },
    { label: "Unsubscribed", value: stats.unsubscribed, icon: UserX, color: "text-gray-500" }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Email Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map(m => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold">{m.value}</p>
                {m.rate && <p className="text-sm text-green-600">{m.rate}</p>}
              </div>
              <m.icon className={`w-8 h-8 ${m.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Campaign Performance</h3>
        <div className="space-y-2">
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <p className="font-medium">Campaign {c.id}</p>
                <p className="text-sm text-muted-foreground">{c.sent} sent</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Open Rate</p>
                  <p className="font-semibold">{c.openRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Click Rate</p>
                  <p className="font-semibold">{c.clickRate}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
