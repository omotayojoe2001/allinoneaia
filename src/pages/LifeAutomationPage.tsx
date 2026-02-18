import { Sparkles } from "lucide-react";

const LifeAutomationPage = () => (
  <div className="flex-1 overflow-y-auto px-6 py-8">
    <div className="max-w-3xl mx-auto text-center py-20">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "hsl(var(--module-life) / 0.12)" }}>
        <Sparkles className="w-8 h-8" style={{ color: "hsl(var(--module-life))" }} />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Life Automation</h1>
      <p className="text-muted-foreground mb-4">This module is coming soon. We're building AI-powered automation to simplify your daily tasks.</p>
      <span className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground">Coming Soon</span>
    </div>
  </div>
);

export default LifeAutomationPage;
