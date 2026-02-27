import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { title: "Welcome", description: "Let's set up your business" },
  { title: "Business Type", description: "What type of business do you run?" },
  { title: "Your Goals", description: "What do you want to achieve?" },
  { title: "Quick Setup", description: "Let's configure key features" }
];

const BUSINESS_TYPES = ["Retail", "Service", "Manufacturing", "E-commerce", "Consulting", "Other"];
const GOALS = [
  { id: "track_expenses", label: "Track Expenses & Income" },
  { id: "manage_inventory", label: "Manage Inventory" },
  { id: "payroll", label: "Run Payroll" },
  { id: "invoicing", label: "Send Invoices" },
  { id: "crm", label: "Manage Customers" },
  { id: "reports", label: "Financial Reports" }
];

export default function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from("user_onboarding").select("*").eq("user_id", user.id).single();
    if (!data || (!data.completed_at && !data.skipped)) {
      setOpen(true);
    }
  };

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_onboarding").upsert({
      user_id: user.id,
      current_step: step,
      business_type: businessType,
      primary_goals: goals,
      completed_at: step === 4 ? new Date().toISOString() : null
    });
  };

  const next = async () => {
    await saveProgress();
    if (step === 4) {
      setOpen(false);
      toast({ title: "Setup Complete!", description: "You're ready to go" });
    } else {
      setStep(step + 1);
    }
  };

  const skip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_onboarding").upsert({ user_id: user.id, skipped: true });
    setOpen(false);
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.includes(id) ? goals.filter(g => g !== id) : [...goals, id]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{STEPS[step - 1].title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{STEPS[step - 1].description}</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="text-center space-y-4">
              <p>Welcome to AllInOneAIA! We'll help you set up your business management system in just a few steps.</p>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map(type => (
                <Button key={type} variant={businessType === type ? "default" : "outline"}
                  onClick={() => setBusinessType(type)} className="h-20">
                  {type}
                </Button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {GOALS.map(goal => (
                <div key={goal.id} className="flex items-center space-x-2">
                  <Checkbox checked={goals.includes(goal.id)} onCheckedChange={() => toggleGoal(goal.id)} />
                  <label className="text-sm cursor-pointer" onClick={() => toggleGoal(goal.id)}>{goal.label}</label>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm">Based on your goals, we recommend starting with:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {goals.includes("track_expenses") && <li>Cashbook for tracking transactions</li>}
                {goals.includes("manage_inventory") && <li>Inventory Intelligence for stock management</li>}
                {goals.includes("payroll") && <li>Payroll Management for staff payments</li>}
                {goals.includes("invoicing") && <li>Invoice system with reminders</li>}
                {goals.includes("crm") && <li>Customer Intelligence for CRM</li>}
                {goals.includes("reports") && <li>Financial reports and analytics</li>}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={skip}>Skip</Button>
          <div className="flex gap-2">
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button onClick={next}>{step === 4 ? "Finish" : "Next"}</Button>
          </div>
        </div>

        <div className="flex justify-center gap-1">
          {STEPS.map((_, idx) => (
            <div key={idx} className={`h-1 w-8 rounded ${idx + 1 === step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
