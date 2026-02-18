import { Headphones } from "lucide-react";

const tickets = [
  { id: "#412", subject: "Billing inquiry", status: "Open", priority: "Normal", time: "2 hrs ago" },
  { id: "#411", subject: "Integration issue", status: "In Progress", priority: "Urgent", time: "5 hrs ago" },
  { id: "#410", subject: "Feature request", status: "Closed", priority: "Low", time: "1 day ago" },
];

const CustomerServicePage = () => (
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
        <Headphones className="w-5 h-5" style={{ color: "hsl(var(--module-customer))" }} /> Customer Service
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Support tickets and call logs</p>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="glass-card rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">{t.id}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{t.subject}</p>
                <p className="text-xs text-muted-foreground">{t.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === "Urgent" ? "bg-destructive/15 text-red-400" : "bg-secondary text-muted-foreground"}`}>
                {t.priority}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "Open" ? "bg-primary/15 text-primary" : t.status === "In Progress" ? "bg-yellow-500/15 text-yellow-400" : "bg-secondary text-muted-foreground"}`}>
                {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CustomerServicePage;
