import { supabase } from "./supabase";

export interface FlutterwaveConfig {
  public_key: string;
  secret_key: string;
}

class FlutterwaveService {
  async getConfig(userId: string): Promise<FlutterwaveConfig | null> {
    const { data } = await supabase
      .from("payment_gateway_settings")
      .select("flutterwave_public_key, flutterwave_secret_key, flutterwave_enabled")
      .eq("user_id", userId)
      .single();

    if (!data?.flutterwave_enabled || !data.flutterwave_public_key) return null;

    return {
      public_key: data.flutterwave_public_key,
      secret_key: data.flutterwave_secret_key,
    };
  }

  async initializePayment(
    userId: string,
    email: string,
    amount: number,
    metadata: any = {}
  ): Promise<{ reference: string }> {
    const config = await this.getConfig(userId);
    if (!config) throw new Error("Flutterwave not configured");

    const reference = `FLW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await supabase.from("payment_transactions_log").insert({
      user_id: userId,
      related_invoice_id: metadata.invoice_id,
      gateway: "flutterwave",
      transaction_reference: reference,
      amount,
      currency: "NGN",
      status: "pending",
      customer_email: email,
      customer_name: metadata.customer_name,
    });

    return new Promise((resolve, reject) => {
      const handler = (window as any).FlutterwaveCheckout({
        public_key: config.public_key,
        tx_ref: reference,
        amount,
        currency: "NGN",
        payment_options: "card,banktransfer,ussd",
        customer: {
          email,
          name: metadata.customer_name || email,
        },
        customizations: {
          title: metadata.title || "Payment",
          description: metadata.description || "Invoice Payment",
        },
        callback: (response: any) => {
          resolve({ reference: response.tx_ref });
        },
        onclose: () => {
          reject(new Error("Payment cancelled"));
        },
      });
    });
  }

  async generatePaymentLink(userId: string, invoiceId: string, amount: number, email: string): Promise<string> {
    const config = await this.getConfig(userId);
    if (!config) throw new Error("Flutterwave not configured");

    const reference = `INV_${invoiceId}_${Date.now()}`;
    
    await supabase.from("payment_transactions_log").insert({
      user_id: userId,
      related_invoice_id: invoiceId,
      gateway: "flutterwave",
      transaction_reference: reference,
      amount,
      currency: "NGN",
      status: "pending",
      customer_email: email,
    });

    return `https://checkout.flutterwave.com/v3/hosted/pay/${reference}`;
  }
}

export const flutterwaveService = new FlutterwaveService();
