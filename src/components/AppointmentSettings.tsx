import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

export default function AppointmentSettings() {
  const [settings, setSettings] = useState({
    appointment_notifications_enabled: true,
    appointment_reminder_times: ["1440", "60", "30"],
    appointment_whatsapp: true,
    appointment_email: true,
    appointment_google_calendar: true
  });
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase.from("notification_settings").select("*").eq("user_id", user.id).single();
    if (data) {
      setSettings({
        appointment_notifications_enabled: data.appointment_notifications_enabled,
        appointment_reminder_times: data.appointment_reminder_times || ["1440", "60", "30"],
        appointment_whatsapp: data.appointment_whatsapp,
        appointment_email: data.appointment_email,
        appointment_google_calendar: data.appointment_google_calendar
      });
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("notification_settings").upsert({
      user_id: user.id,
      ...settings
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Settings saved" });
      setOpen(false);
    }
  };

  const toggleReminderTime = (time: string) => {
    const times = settings.appointment_reminder_times.includes(time)
      ? settings.appointment_reminder_times.filter(t => t !== time)
      : [...settings.appointment_reminder_times, time];
    setSettings({ ...settings, appointment_reminder_times: times });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Notifications</Label>
            <input
              type="checkbox"
              checked={settings.appointment_notifications_enabled}
              onChange={(e) => setSettings({ ...settings, appointment_notifications_enabled: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {settings.appointment_notifications_enabled && (
            <>
              <div>
                <Label className="mb-2 block">Reminder Times</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.appointment_reminder_times.includes("1440")}
                      onChange={() => toggleReminderTime("1440")}
                      className="w-4 h-4"
                    />
                    <Label>1 day before</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.appointment_reminder_times.includes("60")}
                      onChange={() => toggleReminderTime("60")}
                      className="w-4 h-4"
                    />
                    <Label>1 hour before</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.appointment_reminder_times.includes("30")}
                      onChange={() => toggleReminderTime("30")}
                      className="w-4 h-4"
                    />
                    <Label>30 minutes before</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.appointment_reminder_times.includes("15")}
                      onChange={() => toggleReminderTime("15")}
                      className="w-4 h-4"
                    />
                    <Label>15 minutes before</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Notification Channels</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>WhatsApp</Label>
                    <input
                      type="checkbox"
                      checked={settings.appointment_whatsapp}
                      onChange={(e) => setSettings({ ...settings, appointment_whatsapp: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Email</Label>
                    <input
                      type="checkbox"
                      checked={settings.appointment_email}
                      onChange={(e) => setSettings({ ...settings, appointment_email: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Google Calendar</Label>
                    <input
                      type="checkbox"
                      checked={settings.appointment_google_calendar}
                      onChange={(e) => setSettings({ ...settings, appointment_google_calendar: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
