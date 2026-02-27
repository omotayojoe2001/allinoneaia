import { supabase } from "./supabase";
import { paystackService } from "./paystack";
import { flutterwaveService } from "./flutterwave";
import { recordInvoicePayment } from "./business-integration";

export async function generateInvoicePaymentLink(
  userId: string,
  invoiceId: string,
  amount: number,
  customerEmail: string,
  currency: string = "NGN"
): Promise<string> {
  const { data: settings } = await supabase
    .from("payment_gateway_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!settings) throw new Error("Payment gateway not configured");

  const gateway = settings.preferred_gateway || "paystack";

  if (gateway === "paystack" && settings.paystack_enabled) {
    return await paystackService.generatePaymentLink(userId, invoiceId, amount, customerEmail);
  } else if (gateway === "flutterwave" && settings.flutterwave_enabled) {
    return await flutterwaveService.generatePaymentLink(userId, invoiceId, amount, customerEmail);
  }

  throw new Error("No payment gateway enabled");
}

export async function handlePaymentWebhook(
  gateway: "paystack" | "flutterwave",
  reference: string,
  status: "success" | "failed"
): Promise<void> {
  const { data: transaction } = await supabase
    .from("payment_transactions_log")
    .select("*")
    .eq("transaction_reference", reference)
    .single();

  if (!transaction) throw new Error("Transaction not found");

  await supabase
    .from("payment_transactions_log")
    .update({
      status: status === "success" ? "success" : "failed",
      paid_at: status === "success" ? new Date().toISOString() : null,
    })
    .eq("transaction_reference", reference);

  if (status === "success" && transaction.related_invoice_id) {
    await recordInvoicePayment(
      transaction.user_id,
      transaction.related_invoice_id,
      parseFloat(transaction.amount)
    );
  }
}
