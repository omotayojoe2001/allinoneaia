import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Bell, Clock, Mail, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const InvoiceReminders = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [config, setConfig] = useState({
    enabled: true,
    reminder_before_due: 3,
    reminder_on_due: true,
    reminder_after_due_1: 7,
    reminder_after_due_2: 14,
    auto_send: false,
    email_template: "Hi {customer_name},\n\nThis is a reminder that invoice {invoice_number} for {amount} is due on {due_date}.\n\nThank you!",
    whatsapp_template: "Hi {customer_name}, invoice {invoice_number} for {amount} is due on {due_date}. Thank you!"
  });
  const [agingData, setAgingData] = useState<any>(null);
  const [reminderLogs, setReminderLogs] = useState<any[]>([]);
  const [activeView, setActiveView] = useState("settings");

  useEffect(() => {
    if (user) {
      loadConfig();
      loadAgingData();
      loadReminderLogs();
    }
  }, [user]);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("invoice_reminders_config")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (data) setConfig(data);
  };

  const loadAgingData = async () => {
    const { data } = await supabase
      .from("invoice_aging_snapshots")
      .select("*")
      .eq("user_id", user?.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .single();

    if (data) setAgingData(data);
  };

  const loadReminderLogs = async () => {
    const { data } = await supabase
      .from("invoice_reminder_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setReminderLogs(data);
  };

  const saveConfig = async () => {
    const { data: existing } = await supabase
      .from("invoice_reminders_config")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (existing) {
      await supabase
        .from("invoice_reminders_config")
        .update(config)
        .eq("user_id", user?.id);
    } else {
      await supabase
        .from("invoice_reminders_config")
        .insert({ ...config, user_id: user?.id });
    }

    toast({ title: "Success", description: "Reminder settings saved" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Invoice Reminders & Aging
          </h1>
          <p className="text-sm text-muted-foreground">Automated payment reminders and aging reports</p>
        </div>

        <div className="flex gap-1">
          {[
            { id: "settings", label: "Settings" },
            { id: "aging", label: "Aging Report" },
            { id: "logs", label: "Reminder Logs" },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 text-sm font-medium rounded transition-all flex items-center gap-1 ${
                activeView === view.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {view.label}
              {activeView === view.id && <ChevronRight className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {activeView === "settings" && (
            <div className="space-y-6">
              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Enable Reminders</h2>
                    <p className="text-sm text-muted-foreground">Automatically remind customers about due invoices</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                  />
                </div>
              </div>

              {config.enabled && (
                <>
                  <div className="glass-card rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Reminder Schedule</h2>
                    <div className="space-y-4">
                      <div>
                        <Label>Days before due date</Label>
                        <Input
                          type="number"
                          value={config.reminder_before_due}
                          onChange={(e) => setConfig({ ...config, reminder_before_due: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Send reminder on due date</Label>
                        <Switch
                          checked={config.reminder_on_due}
                          onCheckedChange={(checked) => setConfig({ ...config, reminder_on_due: checked })}
                        />
                      </div>
                      <div>
                        <Label>Days after due date (1st reminder)</Label>
                        <Input
                          type="number"
                          value={config.reminder_after_due_1}
                          onChange={(e) => setConfig({ ...config, reminder_after_due_1: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Days after due date (2nd reminder)</Label>
                        <Input
                          type="number"
                          value={config.reminder_after_due_2}
                          onChange={(e) => setConfig({ ...config, reminder_after_due_2: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-send reminders</Label>
                          <p className="text-xs text-muted-foreground">Send automatically without approval</p>
                        </div>
                        <Switch
                          checked={config.auto_send}
                          onCheckedChange={(checked) => setConfig({ ...config, auto_send: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email Template
                    </h2>
                    <Textarea
                      value={config.email_template}
                      onChange={(e) => setConfig({ ...config, email_template: e.target.value })}
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Variables: {"{customer_name}"}, {"{invoice_number}"}, {"{amount}"}, {"{due_date}"}
                    </p>
                  </div>

                  <div className="glass-card rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      WhatsApp Template
                    </h2>
                    <Textarea
                      value={config.whatsapp_template}
                      onChange={(e) => setConfig({ ...config, whatsapp_template: e.target.value })}
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Variables: {"{customer_name}"}, {"{invoice_number}"}, {"{amount}"}, {"{due_date}"}
                    </p>
                  </div>

                  <Button onClick={saveConfig} className="w-full">
                    Save Settings
                  </Button>
                </>
              )}
            </div>
        )}

        {activeView === "aging" && (
            <div className="glass-card rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Invoice Aging Report</h2>
              </div>

              {agingData ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="glass-card rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Current (0-30)</p>
                      <p className="text-xl font-bold text-green-500">{formatAmount(agingData.current_0_30)}</p>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">31-60 Days</p>
                      <p className="text-xl font-bold text-yellow-500">{formatAmount(agingData.overdue_31_60)}</p>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">61-90 Days</p>
                      <p className="text-xl font-bold text-orange-500">{formatAmount(agingData.overdue_61_90)}</p>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">90+ Days</p>
                      <p className="text-xl font-bold text-red-500">{formatAmount(agingData.overdue_90_plus)}</p>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
                      <p className="text-xl font-bold text-foreground">{formatAmount(agingData.total_outstanding)}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(agingData.snapshot_date).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No aging data available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Aging reports are generated automatically</p>
                </div>
              )}
            </div>
        )}

        {activeView === "logs" && (
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reminders</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Invoice</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Via</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border">
                        <td className="py-3 px-4 text-sm text-foreground">{log.invoice_reference}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{log.customer_email || log.customer_phone}</td>
                        <td className="py-3 px-4 text-sm text-foreground capitalize">{log.reminder_type.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4 text-sm text-foreground capitalize">{log.sent_via}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            log.status === 'sent' ? 'bg-green-500/15 text-green-500' :
                            log.status === 'failed' ? 'bg-red-500/15 text-red-500' :
                            'bg-yellow-500/15 text-yellow-500'
                          }`}>
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceReminders;
