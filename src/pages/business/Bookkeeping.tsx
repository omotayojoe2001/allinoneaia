import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Bookkeeping() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const { formatAmount } = useCurrency();

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const fetchAllTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [cashbook, invoices, creditsDebits] = await Promise.all([
      supabase.from("cashbook_transactions").select("*").eq("user_id", user.id),
      supabase.from("invoices").select("*, customers(name)").eq("user_id", user.id),
      supabase.from("credits_debits").select("*, customers(name)").eq("user_id", user.id)
    ]);

    const allTransactions = [
      ...(cashbook.data || []).map(t => ({ ...t, source: "cashbook", date: t.date, customer: null })),
      ...(invoices.data || []).map(t => ({ ...t, source: "invoice", date: t.created_at.split("T")[0], customer: t.customers?.name })),
      ...(creditsDebits.data || []).map(t => ({ ...t, source: "credit_debit", date: t.created_at.split("T")[0], customer: t.customers?.name }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(allTransactions);
  };

  const filteredTransactions = filter === "all" ? transactions : transactions.filter(t => t.source === filter);

  const totalIncome = transactions.filter(t => t.type === "income" || (t.source === "invoice" && t.status === "paid")).reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalCredits = transactions.filter(t => t.type === "credit" && t.status === "pending").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalDebits = transactions.filter(t => t.type === "debit" && t.status === "pending").reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
      <Link to="/business" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-3xl font-bold mb-6">Bookkeeping</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Expense</p>
          <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpense)}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending Credits</p>
          <p className="text-2xl font-bold text-blue-600">{formatAmount(totalCredits)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Net Balance</p>
          <p className="text-2xl font-bold text-purple-600">{formatAmount(totalIncome - totalExpense)}</p>
        </div>
      </div>

      <div className="mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="cashbook">Cashbook Only</SelectItem>
            <SelectItem value="invoice">Invoices Only</SelectItem>
            <SelectItem value="credit_debit">Credits & Debits Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3">{transaction.date}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs bg-gray-100">
                    {transaction.source === "cashbook" ? "Cashbook" : transaction.source === "invoice" ? "Invoice" : "Credit/Debit"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {transaction.type && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      transaction.type === "income" || transaction.type === "credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {transaction.type}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{transaction.customer || "N/A"}</td>
                <td className="px-4 py-3">{transaction.description || transaction.category || transaction.invoice_number || "N/A"}</td>
                <td className="px-4 py-3 font-semibold">{formatAmount(parseFloat(transaction.amount))}</td>
                <td className="px-4 py-3">
                  {transaction.status && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      transaction.status === "paid" || transaction.status === "settled" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {transaction.status}
                    </span>
                  )}
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
