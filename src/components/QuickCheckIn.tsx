import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickCheckIn() {
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayRecord();
  }, []);

  const fetchTodayRecord = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .eq("staff_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setTodayRecord(data);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    const { error } = await supabase.from("attendance").insert({
      user_id: user.id,
      staff_id: user.id,
      date: today,
      check_in: now,
      status: "present"
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Checked in successfully" });
      fetchTodayRecord();
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setLoading(true);

    const now = new Date().toTimeString().split(' ')[0];
    const { error } = await supabase
      .from("attendance")
      .update({ check_out: now })
      .eq("id", todayRecord.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Checked out successfully" });
      fetchTodayRecord();
    }
    setLoading(false);
  };

  const hasCheckedIn = todayRecord && todayRecord.check_in;
  const hasCheckedOut = todayRecord && todayRecord.check_out;

  return (
    <div className="glass-card rounded-lg p-5">
      <h2 className="text-foreground font-semibold flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        Quick Check-In
      </h2>
      <div className="space-y-3">
        {hasCheckedIn && (
          <div className="text-sm text-foreground">
            <p className="text-muted-foreground">Checked in at</p>
            <p className="font-semibold">{todayRecord.check_in}</p>
          </div>
        )}
        {hasCheckedOut && (
          <div className="text-sm text-foreground">
            <p className="text-muted-foreground">Checked out at</p>
            <p className="font-semibold">{todayRecord.check_out}</p>
          </div>
        )}
        {!hasCheckedIn && (
          <Button onClick={handleCheckIn} disabled={loading} className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Check In
          </Button>
        )}
        {hasCheckedIn && !hasCheckedOut && (
          <Button onClick={handleCheckOut} disabled={loading} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Check Out
          </Button>
        )}
        {hasCheckedOut && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center">✓ All done for today!</p>
        )}
      </div>
    </div>
  );
}
