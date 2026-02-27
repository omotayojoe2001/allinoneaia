import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

export default function NotificationsCenter() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [prefs, setPrefs] = useState({ email_enabled: true, sms_enabled: false, push_enabled: true, in_app_enabled: true });

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    if (data) setNotifications(data);
  };

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).single();
    if (data) setPrefs(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    loadNotifications();
  };

  const updatePreferences = async (field: string, value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      ...prefs,
      [field]: value
    });

    setPrefs({ ...prefs, [field]: value });
    toast({ title: "Saved", description: "Preferences updated" });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">{unreadCount} unread</span>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Notification Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span>Email Notifications</span>
            </div>
            <Switch checked={prefs.email_enabled} onCheckedChange={v => updatePreferences("email_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>SMS Notifications</span>
            </div>
            <Switch checked={prefs.sms_enabled} onCheckedChange={v => updatePreferences("sms_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              <span>Push Notifications</span>
            </div>
            <Switch checked={prefs.push_enabled} onCheckedChange={v => updatePreferences("push_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span>In-App Notifications</span>
            </div>
            <Switch checked={prefs.in_app_enabled} onCheckedChange={v => updatePreferences("in_app_enabled", v)} />
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {notifications.map(n => (
          <Card key={n.id} className={`p-4 ${n.is_read ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <Button size="sm" variant="ghost" onClick={() => markAsRead(n.id)}>Mark Read</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
