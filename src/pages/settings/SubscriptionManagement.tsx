import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown } from "lucide-react";

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [usage, setUsage] = useState({ invoices: 0, customers: 0, emails: 0 });

  useEffect(() => {
    loadPlans();
    loadSubscription();
    loadUsage();
  }, []);

  const loadPlans = async () => {
    const { data } = await supabase.from("subscription_plans").select("*").eq("is_active", true);
    if (data) setPlans(data);
  };

  const loadSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("user_subscriptions").select("*, subscription_plans(*)").eq("user_id", user.id).single();
    if (data) setCurrentSub(data);
  };

  const loadUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: invoices } = await supabase.from("invoices").select("id").eq("user_id", user.id);
    const { data: customers } = await supabase.from("customers").select("id").eq("user_id", user.id);
    setUsage({ invoices: invoices?.length || 0, customers: customers?.length || 0, emails: 0 });
  };

  const subscribe = async (planId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const periodEnd = new Date(now.setMonth(now.getMonth() + 1));

    await supabase.from("user_subscriptions").upsert({
      user_id: user.id,
      plan_id: planId,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString()
    });

    toast({ title: "Success", description: "Subscription updated" });
    loadSubscription();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Subscription & Billing</h1>

      {currentSub && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-2xl font-bold">{currentSub.subscription_plans?.name}</p>
              <p className="text-sm">Status: <span className="text-green-600">{currentSub.status}</span></p>
            </div>
            <Crown className="w-12 h-12 text-yellow-500" />
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Usage This Month</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Invoices</p>
            <p className="text-xl font-bold">{usage.invoices}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customers</p>
            <p className="text-xl font-bold">{usage.customers}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Emails Sent</p>
            <p className="text-xl font-bold">{usage.emails}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className="p-6">
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold mb-4">₦{plan.price}<span className="text-sm text-muted-foreground">/{plan.billing_cycle}</span></p>
            <ul className="space-y-2 mb-6">
              {plan.features && Object.entries(plan.features).map(([key, value]: any) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  {value}
                </li>
              ))}
            </ul>
            <Button className="w-full" onClick={() => subscribe(plan.id)} 
              disabled={currentSub?.plan_id === plan.id}>
              {currentSub?.plan_id === plan.id ? "Current Plan" : "Subscribe"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
