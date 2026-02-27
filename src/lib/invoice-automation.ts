import { supabase } from "./supabase";

export async function processInvoiceReminders(): Promise<void> {
  const { data: configs } = await supabase
    .from("invoice_reminders_config")
    .select("*")
    .eq("enabled", true);

  if (!configs) return;

  for (const config of configs) {
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*, customers(name, email, phone)")
      .eq("user_id", config.user_id)
      .neq("payment_status", "paid");

    if (!invoices) continue;

    const today = new Date();

    for (const invoice of invoices) {
      if (!invoice.due_date) continue;

      const dueDate = new Date(invoice.due_date);
      const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let reminderType: string | null = null;

      if (daysDiff === config.reminder_before_due) {
        reminderType = "before_due";
      } else if (daysDiff === 0 && config.reminder_on_due) {
        reminderType = "on_due";
      } else if (daysDiff === -config.reminder_after_due_1) {
        reminderType = "after_due_1";
      } else if (daysDiff === -config.reminder_after_due_2) {
        reminderType = "after_due_2";
      }

      if (reminderType) {
        const alreadySent = await supabase
          .from("invoice_reminder_logs")
          .select("id")
          .eq("invoice_reference", invoice.invoice_number)
          .eq("reminder_type", reminderType)
          .single();

        if (!alreadySent.data) {
          await sendInvoiceReminder(config, invoice, reminderType);
        }
      }
    }
  }
}

async function sendInvoiceReminder(config: any, invoice: any, reminderType: string): Promise<void> {
  const template = config.email_template || "";
  const message = template
    .replace("{customer_name}", invoice.customers?.name || "Customer")
    .replace("{invoice_number}", invoice.invoice_number)
    .replace("{amount}", `${invoice.currency} ${parseFloat(invoice.amount).toFixed(2)}`)
    .replace("{due_date}", new Date(invoice.due_date).toLocaleDateString());

  const log = {
    user_id: config.user_id,
    invoice_reference: invoice.invoice_number,
    customer_email: invoice.customers?.email,
    customer_phone: invoice.customers?.phone,
    reminder_type: reminderType,
    sent_via: "email",
    status: config.auto_send ? "sent" : "pending",
    sent_at: config.auto_send ? new Date().toISOString() : null,
  };

  await supabase.from("invoice_reminder_logs").insert(log);

  if (config.auto_send && invoice.customers?.email) {
    console.log(`Sending reminder to ${invoice.customers.email}: ${message}`);
  }
}

export async function generateAgingReport(userId: string): Promise<void> {
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .neq("payment_status", "paid");

  if (!invoices) return;

  const today = new Date();
  const aging = {
    current_0_30: 0,
    overdue_31_60: 0,
    overdue_61_90: 0,
    overdue_90_plus: 0,
    total_outstanding: 0,
  };

  for (const invoice of invoices) {
    const amount = parseFloat(invoice.amount);
    aging.total_outstanding += amount;

    if (!invoice.due_date) {
      aging.current_0_30 += amount;
      continue;
    }

    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 30) {
      aging.current_0_30 += amount;
    } else if (daysOverdue <= 60) {
      aging.overdue_31_60 += amount;
    } else if (daysOverdue <= 90) {
      aging.overdue_61_90 += amount;
    } else {
      aging.overdue_90_plus += amount;
    }
  }

  await supabase.from("invoice_aging_snapshots").insert({
    user_id: userId,
    snapshot_date: today.toISOString().split("T")[0],
    ...aging,
  });
}
