import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function BudgetVsActual() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data } = await supabase.from("budget_tracking").select("*").eq("user_id", user.id)
      .gte("period_start", startOfMonth.toISOString()).lte("period_end", endOfMonth.toISOString());

    if (data) {
      const { data: cashbook } = await supabase.from("cashbook").select("*").eq("user_id", user.id).eq("type", "expense")
        .gte("date", startOfMonth.toISOString());

      const updated = data.map(b => {
        const actual = cashbook?.filter(c => c.category === b.category).reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        const variance = parseFloat(b.budgeted_amount) - actual;
        const variancePercentage = (variance / parseFloat(b.budgeted_amount)) * 100;
        return { ...b, actual_amount: actual, variance, variance_percentage: variancePercentage };
      });

      setBudgets(updated);
    }
  };

  const addBudget = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await supabase.from("budget_tracking").insert({
      user_id: user.id,
      category,
      period_start: startOfMonth.toISOString(),
      period_end: endOfMonth.toISOString(),
      budgeted_amount: parseFloat(amount)
    });

    toast({ title: "Success", description: "Budget added" });
    setCategory("");
    setAmount("");
    loadBudgets();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Budget vs Actual</h1>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Add Budget</h3>
        <div className="flex gap-2">
          <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
          <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          <Button onClick={addBudget}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Current Month</h3>
        <div className="space-y-3">
          {budgets.map(b => (
            <div key={b.id} className="p-4 border rounded">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">{b.category}</p>
                <span className={`px-2 py-1 rounded text-sm ${
                  b.variance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {b.variance >= 0 ? "Under Budget" : "Over Budget"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Budgeted</p>
                  <p className="font-semibold">₦{parseFloat(b.budgeted_amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actual</p>
                  <p className="font-semibold">₦{b.actual_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Variance</p>
                  <p className={`font-semibold ${b.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₦{Math.abs(b.variance).toLocaleString()} ({Math.abs(b.variance_percentage).toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
