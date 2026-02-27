import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: configs } = await supabase
      .from('invoice_reminders_config')
      .select('*')
      .eq('enabled', true)

    if (!configs) {
      return new Response(JSON.stringify({ message: 'No configs found' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let processed = 0

    for (const config of configs) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, customers(name, email, phone)')
        .eq('user_id', config.user_id)
        .neq('payment_status', 'paid')

      if (!invoices) continue

      const today = new Date()

      for (const invoice of invoices) {
        if (!invoice.due_date) continue

        const dueDate = new Date(invoice.due_date)
        const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        let reminderType = null

        if (daysDiff === config.reminder_before_due) {
          reminderType = 'before_due'
        } else if (daysDiff === 0 && config.reminder_on_due) {
          reminderType = 'on_due'
        } else if (daysDiff === -config.reminder_after_due_1) {
          reminderType = 'after_due_1'
        } else if (daysDiff === -config.reminder_after_due_2) {
          reminderType = 'after_due_2'
        }

        if (reminderType) {
          const { data: existing } = await supabase
            .from('invoice_reminder_logs')
            .select('id')
            .eq('invoice_reference', invoice.invoice_number)
            .eq('reminder_type', reminderType)
            .single()

          if (!existing) {
            await supabase.from('invoice_reminder_logs').insert({
              user_id: config.user_id,
              invoice_reference: invoice.invoice_number,
              customer_email: invoice.customers?.email,
              customer_phone: invoice.customers?.phone,
              reminder_type: reminderType,
              sent_via: 'email',
              status: config.auto_send ? 'sent' : 'pending',
              sent_at: config.auto_send ? new Date().toISOString() : null,
            })
            processed++
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
