import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "pending", due_date: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null
    };

    if (editId) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Task updated" });
        setOpen(false);
        setEditId(null);
        setForm({ title: "", description: "", priority: "medium", status: "pending", due_date: "" });
        fetchTasks();
      }
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Task created" });
        setOpen(false);
        setForm({ title: "", description: "", priority: "medium", status: "pending", due_date: "" });
        fetchTasks();
      }
    }
  };

  const handleEdit = (task: any) => {
    setEditId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || ""
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Task deleted" });
      fetchTasks();
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const statusFlow = { pending: "in_progress", in_progress: "completed", completed: "pending" };
    const newStatus = statusFlow[currentStatus as keyof typeof statusFlow];
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchTasks();
    }
  };

  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
      <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm({ title: "", description: "", priority: "medium", status: "pending", due_date: "" }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Task" : "New Task"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">{editId ? "Update" : "Create"} Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-3 font-medium">{task.title}</td>
                <td className="px-4 py-3">{task.description || "N/A"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.priority === "high" ? "bg-red-100 text-red-800" :
                    task.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(task.id, task.status)} className={`px-2 py-1 rounded text-xs ${
                    task.status === "completed" ? "bg-green-100 text-green-800" :
                    task.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {task.status.replace("_", " ")}
                  </button>
                </td>
                <td className="px-4 py-3">{task.due_date || "N/A"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(task)}>
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}>
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
