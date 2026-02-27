import { supabase } from "./supabase";

export interface PaystackConfig {
  public_key: string;
  secret_key: string;
}

class PaystackService {
  async getConfig(userId: string): Promise<PaystackConfig | null> {
    const { data } = await supabase
      .from("payment_gateway_settings")
      .select("paystack_public_key, paystack_secret_key, paystack_enabled")
      .eq("user_id", userId)
      .single();

    if (!data?.paystack_enabled || !data.paystack_public_key) return null;

    return {
      public_key: data.paystack_public_key,
      secret_key: data.paystack_secret_key,
    };
  }

  async initializePayment(
    userId: string,
    email: string,
    amount: number,
    metadata: any = {}
  ): Promise<{ reference: string }> {
    const config = await this.getConfig(userId);
    if (!config) throw new Error("Paystack not configured");

    const reference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await supabase.from("payment_transactions_log").insert({
      user_id: userId,
      related_invoice_id: metadata.invoice_id,
      gateway: "paystack",
      transaction_reference: reference,
      amount,
      currency: "NGN",
      status: "pending",
      customer_email: email,
      customer_name: metadata.customer_name,
    });

    document.body.classList.add('paystack-open');

    return new Promise((resolve, reject) => {
      const handler = (window as any).PaystackPop.setup({
        key: config.public_key,
        email,
        amount: Math.round(amount * 100),
        currency: "NGN",
        ref: reference,
        metadata,
        callback: (response: any) => {
          document.body.classList.remove('paystack-open');
          resolve({ reference: response.reference });
        },
        onClose: () => {
          document.body.classList.remove('paystack-open');
          reject(new Error("Payment cancelled"));
        },
      });

      handler.openIframe();
    });
  }

  async verifyPayment(reference: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { reference },
    });

    if (error || !data?.success) throw new Error("Payment verification failed");
    return true;
  }

  async generatePaymentLink(userId: string, invoiceId: string, amount: number, email: string): Promise<string> {
    const config = await this.getConfig(userId);
    if (!config) throw new Error("Paystack not configured");

    const reference = `INV_${invoiceId}_${Date.now()}`;
    
    await supabase.from("payment_transactions_log").insert({
      user_id: userId,
      related_invoice_id: invoiceId,
      gateway: "paystack",
      transaction_reference: reference,
      amount,
      currency: "NGN",
      status: "pending",
      customer_email: email,
    });

    return `https://paystack.com/pay/${reference}`;
  }
}

export const paystackService = new PaystackService();
