import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function StaffAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: "", date: "", check_in: "", check_out: "", status: "present" });
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
    fetchStaff();
  }, []);

  const fetchAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("attendance").select("*, staff(name)").eq("user_id", user.id).order("date", { ascending: false });
    setAttendance(data || []);
  };

  const fetchStaff = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("staff").select("*").eq("user_id", user.id);
    setStaff(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("attendance").insert({
      user_id: user.id,
      staff_id: form.staff_id,
      date: form.date,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      status: form.status
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Attendance recorded" });
      setOpen(false);
      setForm({ staff_id: "", date: "", check_in: "", check_out: "", status: "present" });
      fetchAttendance();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Record deleted" });
      fetchAttendance();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
      <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Staff Attendance</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Record Attendance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Attendance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Staff Member *</Label>
                <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <Label>Check In</Label>
                <Input type="time" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
              </div>
              <div>
                <Label>Check Out</Label>
                <Input type="time" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendance.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 font-medium">{record.staff?.name}</td>
                <td className="px-4 py-3">{record.date}</td>
                <td className="px-4 py-3">{record.check_in || "N/A"}</td>
                <td className="px-4 py-3">{record.check_out || "N/A"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    record.status === "present" ? "bg-green-100 text-green-800" :
                    record.status === "late" ? "bg-yellow-100 text-yellow-800" :
                    record.status === "leave" ? "bg-blue-100 text-blue-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
