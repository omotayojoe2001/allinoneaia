import { ArrowLeft, Plus, TrendingUp, TrendingDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PageAIAgent } from "@/components/PageAIAgent";
import { pageAgentConfigs } from "@/lib/page-agent-configs";

const Cashbook = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [balance, setBalance] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    const { data } = await supabase.from('cashbook_transactions').select('*').eq('user_id', user?.id).order('date', { ascending: false });
    setTransactions(data || []);
    const income = data?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const expense = data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    setBalance({ income, expense });
  };

  const addTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await supabase.from('cashbook_transactions').insert({
      user_id: user?.id,
      type: formData.get('type'),
      amount: formData.get('amount'),
      category: formData.get('category'),
      description: formData.get('description'),
      date: formData.get('date')
    });
    setShowModal(false);
    loadTransactions();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <PageAIAgent {...pageAgentConfigs.cashbook} />
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-sm text-muted-foreground">Total Income</p>
            </div>
            <p className="text-2xl font-bold text-green-500">{formatAmount(balance.income)}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <p className="text-sm text-muted-foreground">Total Expense</p>
            </div>
            <p className="text-2xl font-bold text-red-500">{formatAmount(balance.expense)}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Net Balance</p>
            <p className="text-2xl font-bold">{formatAmount(balance.income - balance.expense)}</p>
          </div>
        </div>

        <div className="glass-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
                <th className="text-right px-4 py-3 text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${t.type === 'income' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{t.category}</td>
                  <td className="px-4 py-3 text-sm">{t.description}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatAmount(parseFloat(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Add Transaction</h2>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={addTransaction} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select name="type" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <input name="amount" type="number" step="0.01" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <input name="category" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea name="description" className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" rows={2} />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input name="date" type="date" required className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg" />
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium">Add Transaction</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cashbook;
