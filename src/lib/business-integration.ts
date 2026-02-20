import { supabase } from "./supabase";

/**
 * Business Tools Integration Helper Functions
 * Handles automatic data synchronization between modules
 */

// Auto-record invoice payment in cash book
export async function recordInvoicePayment(
  userId: string,
  invoiceId: string,
  amount: number,
  paymentDate: Date = new Date()
) {
  // Create cash book entry
  const { data: cashbookEntry, error: cashbookError } = await supabase
    .from("cashbook_transactions")
    .insert({
      user_id: userId,
      type: "income",
      amount,
      category: "Sales",
      description: `Payment received for invoice`,
      date: paymentDate.toISOString().split('T')[0],
      source_module: "invoices",
      source_id: invoiceId,
      auto_generated: true,
    })
    .select()
    .single();

  if (cashbookError) throw cashbookError;

  // Update invoice payment status
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({
      payment_status: "paid",
      paid_amount: amount,
      payment_date: paymentDate.toISOString(),
      cashbook_entry_id: cashbookEntry.id,
    })
    .eq("id", invoiceId);

  if (invoiceError) throw invoiceError;

  return cashbookEntry;
}

// Auto-record stock sale in cash book
export async function recordStockSale(
  userId: string,
  saleId: string,
  amount: number,
  profit: number,
  saleDate: Date = new Date()
) {
  const { data: cashbookEntry, error } = await supabase
    .from("cashbook_transactions")
    .insert({
      user_id: userId,
      type: "income",
      amount,
      category: "Stock Sales",
      description: `Stock sale revenue`,
      date: saleDate.toISOString().split('T')[0],
      source_module: "stock_sales",
      source_id: saleId,
      auto_generated: true,
    })
    .select()
    .single();

  if (error) throw error;

  // Update stock sale with cashbook reference and profit
  await supabase
    .from("stock_sales")
    .update({
      cashbook_entry_id: cashbookEntry.id,
      profit,
    })
    .eq("id", saleId);

  return cashbookEntry;
}

// Auto-record stock purchase in cash book
export async function recordStockPurchase(
  userId: string,
  productId: string,
  amount: number,
  supplier: string,
  purchaseDate: Date = new Date()
) {
  const { data: cashbookEntry, error } = await supabase
    .from("cashbook_transactions")
    .insert({
      user_id: userId,
      type: "expense",
      amount,
      category: "Stock Purchase",
      description: `Stock purchase from ${supplier}`,
      date: purchaseDate.toISOString().split('T')[0],
      source_module: "stock",
      source_id: productId,
      auto_generated: true,
    })
    .select()
    .single();

  if (error) throw error;
  return cashbookEntry;
}

// Auto-record staff salary payment in cash book
export async function recordSalaryPayment(
  userId: string,
  paymentId: string,
  staffName: string,
  amount: number,
  paymentDate: Date = new Date()
) {
  const { data: cashbookEntry, error: cashbookError } = await supabase
    .from("cashbook_transactions")
    .insert({
      user_id: userId,
      type: "expense",
      amount,
      category: "Salaries",
      description: `Salary payment to ${staffName}`,
      date: paymentDate.toISOString().split('T')[0],
      source_module: "staff_payments",
      source_id: paymentId,
      auto_generated: true,
    })
    .select()
    .single();

  if (cashbookError) throw cashbookError;

  // Update staff payment with cashbook reference
  await supabase
    .from("salary_payments")
    .update({ cashbook_entry_id: cashbookEntry.id })
    .eq("id", paymentId);

  return cashbookEntry;
}

// Get sales dashboard summary
export async function getSalesDashboardData(userId: string) {
  const { data, error } = await supabase
    .from("sales_dashboard_summary")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  
  return data || {
    total_revenue: 0,
    total_expense: 0,
    net_balance: 0,
    customer_count: 0,
    invoice_count: 0,
    stock_items: 0,
    upcoming_appointments: 0,
    pending_tasks: 0,
  };
}

// Get financial summary for bookkeeping
export async function getFinancialSummary(userId: string) {
  const { data, error } = await supabase
    .from("financial_summary")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  
  return data || {
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
  };
}

// Get detailed bookkeeping data
export async function getBookkeepingData(userId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from("cashbook_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data: transactions, error: txError } = await query;
  if (txError) throw txError;

  // Get invoices
  const { data: invoices, error: invError } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId);
  if (invError) throw invError;

  // Get stock data
  const { data: stock, error: stockError } = await supabase
    .from("stock")
    .select("*")
    .eq("user_id", userId);
  if (stockError) throw stockError;

  // Calculate totals
  const totalIncome = transactions?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const totalExpense = transactions?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const stockValue = stock?.reduce((sum, s) => sum + (s.quantity * s.unit_price), 0) || 0;
  const accountsReceivable = invoices?.filter(i => i.payment_status !== "paid").reduce((sum, i) => sum + parseFloat(i.total_amount), 0) || 0;

  return {
    transactions,
    invoices,
    stock,
    summary: {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      stockValue,
      accountsReceivable,
    },
  };
}
