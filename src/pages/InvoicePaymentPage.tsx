import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const InvoicePaymentPage = () => {
  const { invoiceId } = useParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    document.body.appendChild(script);

    loadInvoice();

    return () => {
      document.body.removeChild(script);
    };
  }, [invoiceId]);

  const loadInvoice = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*, customers(name, email)")
      .eq("id", invoiceId)
      .single();

    setInvoice(data);
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!paystackLoaded) {
      toast({ title: "Error", description: "Payment system loading...", variant: "destructive" });
      return;
    }

    setPaying(true);

    try {
      // Get payment gateway settings
      const { data: settings } = await supabase
        .from("payment_gateway_settings")
        .select("*")
        .eq("user_id", invoice.user_id)
        .single();

      if (!settings?.paystack_enabled || !settings.paystack_public_key) {
        toast({ title: "Error", description: "Payment gateway not configured", variant: "destructive" });
        setPaying(false);
        return;
      }

      // Initialize Paystack payment
      const reference = `INV_${invoice.id.substring(0, 8)}_${Date.now()}`;

      // Save transaction
      await supabase.from("payment_transactions_log").insert({
        user_id: invoice.user_id,
        related_invoice_id: invoice.id,
        gateway: "paystack",
        transaction_reference: reference,
        amount: parseFloat(invoice.amount),
        currency: invoice.currency || "NGN",
        status: "pending",
        customer_email: invoice.customers?.email,
        customer_name: invoice.customers?.name,
      });

      // Load Paystack inline
      const handler = (window as any).PaystackPop.setup({
        key: settings.paystack_public_key,
        email: invoice.customers?.email || 'customer@example.com',
        amount: Math.round(parseFloat(invoice.amount) * 100),
        currency: invoice.currency || "NGN",
        ref: reference,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          custom_fields: [
            {
              display_name: "Invoice Number",
              variable_name: "invoice_number",
              value: invoice.invoice_number
            }
          ]
        },
        callback: async (response: any) => {
          // Update transaction status
          await supabase
            .from("payment_transactions_log")
            .update({ status: "success", paid_at: new Date().toISOString() })
            .eq("transaction_reference", reference);

          // Update invoice status
          await supabase
            .from("invoices")
            .update({ payment_status: "paid" })
            .eq("id", invoice.id);

          // Record in cashbook
          await supabase.from("cashbook_transactions").insert({
            user_id: invoice.user_id,
            type: "income",
            amount: parseFloat(invoice.amount),
            category: "Invoice Payment",
            description: `Payment for invoice ${invoice.invoice_number}`,
            date: new Date().toISOString().split('T')[0],
            source: "invoice",
            source_id: invoice.id,
          });

          toast({ title: "Success!", description: "Payment successful! Reference: " + response.reference });
          setPaying(false);
          loadInvoice();
        },
        onClose: () => {
          setPaying(false);
        },
      });

      handler.openIframe();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Payment failed", variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground">This invoice does not exist.</p>
        </div>
      </div>
    );
  }

  if (invoice.payment_status === "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-green-600">Already Paid</h1>
          <p className="text-muted-foreground">This invoice has been paid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pay Invoice</h1>
          <p className="text-muted-foreground">Invoice #{invoice.invoice_number}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between py-3 border-b">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{invoice.customers?.name}</span>
          </div>
          <div className="flex justify-between py-3 border-b">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-bold text-2xl">
              {invoice.currency} {parseFloat(invoice.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-3 border-b">
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-medium">
              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={paying}
          className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
        >
          {paying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "PAY NOW"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Secure payment powered by Paystack
        </p>
      </div>
    </div>
  );
};

export default InvoicePaymentPage;
