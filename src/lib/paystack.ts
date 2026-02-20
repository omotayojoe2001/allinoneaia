import { supabase } from "./supabase";

export interface PaystackConfig {
  public_key: string;
  secret_key: string;
}

class PaystackService {
  private publicKey: string = "pk_live_a044f9545cbf5130cba970f9d9c1e9472b1f1749";

  async initializePayment(
    email: string,
    amount: number,
    metadata: any = {}
  ): Promise<{ reference: string }> {
    const reference = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save transaction record
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("payment_transactions").insert({
      user_id: user.user?.id,
      reference,
      amount,
      currency: "NGN",
      status: "pending",
    });

    // Add class to body when Paystack opens
    document.body.classList.add('paystack-open');

    // Initialize Paystack payment
    return new Promise((resolve, reject) => {
      const handler = (window as any).PaystackPop.setup({
        key: this.publicKey,
        email,
        amount: Math.round(amount * 100),
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Service",
              variable_name: "service_name",
              value: metadata.service_name || ""
            }
          ]
        },
        callback: (response: any) => {
          document.body.classList.remove('paystack-open');
          resolve({
            reference: response.reference,
          });
        },
        onClose: () => {
          document.body.classList.remove('paystack-open');
          reject(new Error("Payment cancelled by user"));
        },
      });

      handler.openIframe();
    });
  }

  async verifyPayment(reference: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { reference },
    });

    if (error || !data?.success) {
      throw new Error("Payment verification failed");
    }

    return true;
  }
}

export const paystackService = new PaystackService();
