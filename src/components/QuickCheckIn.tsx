import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function QuickCheckIn() {
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [checkType, setCheckType] = useState("check_in");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("staff").select("*").eq("user_id", user.id);
    setStaff(data || []);
  };

  const handleSubmit = async () => {
    if (!selectedStaff) {
      toast({ title: "Error", description: "Please select a staff member", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    if (checkType === "check_in") {
      const { error } = await supabase.from("attendance").insert({
        user_id: user.id,
        staff_id: selectedStaff,
        date: today,
        check_in: now,
        status: "present"
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Staff checked in" });
        setSelectedStaff("");
        setCheckType("check_in");
        fetchStaff();
      }
    } else if (checkType === "break_start") {
      const { error } = await supabase.from("attendance").insert({
        user_id: user.id,
        staff_id: selectedStaff,
        date: today,
        check_in: now,
        status: "break"
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Staff on break" });
        setSelectedStaff("");
        setCheckType("check_in");
      }
    } else if (checkType === "check_out" || checkType === "break_end") {
      const { data: lastRecord } = await supabase
        .from("attendance")
        .select("*")
        .eq("staff_id", selectedStaff)
        .eq("date", today)
        .is("check_out", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRecord) {
        const { error } = await supabase
          .from("attendance")
          .update({ 
            check_out: now,
            status: checkType === "check_out" ? "present" : "present"
          })
          .eq("id", lastRecord.id);

        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Success", description: checkType === "check_out" ? "Staff checked out" : "Staff resumed from break" });
          setSelectedStaff("");
          setCheckType("check_in");
        }
      } else {
        toast({ title: "Error", description: "No active check-in found for today", variant: "destructive" });
      }
    }

    setLoading(false);
  };

  const selectedStaffData = staff.find(s => s.id === selectedStaff);

  return (
    <div className="glass-card rounded-lg p-5">
      <h2 className="text-foreground font-semibold flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        Quick Staff Check-In
      </h2>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Staff Member</Label>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              {staff.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.email ? `- ${s.email}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedStaffData && (
          <div className="text-xs text-muted-foreground bg-secondary p-2 rounded">
            <p>Position: {selectedStaffData.position || "N/A"}</p>
            <p>Email: {selectedStaffData.email || "N/A"}</p>
          </div>
        )}
        <div>
          <Label className="text-sm">Action Type</Label>
          <Select value={checkType} onValueChange={setCheckType}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="check_in">Check In (Sign In)</SelectItem>
              <SelectItem value="break_start">Break Time (Start)</SelectItem>
              <SelectItem value="break_end">Resume from Break</SelectItem>
              <SelectItem value="check_out">Check Out (Sign Out)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          Current Time: {new Date().toLocaleTimeString()}
        </div>
        <Button onClick={handleSubmit} disabled={loading || !selectedStaff} className="w-full">
          {checkType === "check_in" && <LogIn className="w-4 h-4 mr-2" />}
          {checkType === "check_out" && <LogOut className="w-4 h-4 mr-2" />}
          {checkType === "break_start" && <Clock className="w-4 h-4 mr-2" />}
          {checkType === "break_end" && <Clock className="w-4 h-4 mr-2" />}
          Submit
        </Button>
      </div>
    </div>
  );
}
