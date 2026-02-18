import { Bell, Plus } from "lucide-react";

const reminders = [
  { text: "Review Q1 financials", due: "Today 4:00 PM", type: "Manual", done: false },
  { text: "Follow up with client (detected)", due: "Today 6:00 PM", type: "Intent", done: false },
  { text: "Submit weekly report", due: "Tomorrow 9:00 AM", type: "Manual", done: false },
  { text: "Check analytics dashboard", due: "Yesterday", type: "Intent", done: true },
];

const RemindersPage = () => (
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: "hsl(var(--module-reminders))" }} /> Reminders
          </h1>
          <p className="text-sm text-muted-foreground">Manual and intent-based reminders</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Reminder
        </button>
      </div>

      <div className="space-y-2">
        {reminders.map((r) => (
          <div key={r.text} className={`glass-card rounded-lg p-4 flex items-center justify-between ${r.done ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${r.done ? "border-primary bg-primary" : "border-border"}`}>
                {r.done && <span className="text-primary-foreground text-xs">✓</span>}
              </div>
              <div>
                <p className={`text-sm text-foreground ${r.done ? "line-through" : ""}`}>{r.text}</p>
                <p className="text-xs text-muted-foreground">{r.due}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === "Intent" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
              {r.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default RemindersPage;
