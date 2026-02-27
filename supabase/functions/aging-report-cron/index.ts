import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: users } = await supabase
      .from('invoices')
      .select('user_id')
      .neq('payment_status', 'paid')

    if (!users) {
      return new Response(JSON.stringify({ message: 'No users found' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const uniqueUsers = [...new Set(users.map(u => u.user_id))]
    const today = new Date()

    for (const userId of uniqueUsers) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .neq('payment_status', 'paid')

      if (!invoices) continue

      const aging = {
        current_0_30: 0,
        overdue_31_60: 0,
        overdue_61_90: 0,
        overdue_90_plus: 0,
        total_outstanding: 0,
      }

      for (const invoice of invoices) {
        const amount = parseFloat(invoice.amount)
        aging.total_outstanding += amount

        if (!invoice.due_date) {
          aging.current_0_30 += amount
          continue
        }

        const dueDate = new Date(invoice.due_date)
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysOverdue <= 30) {
          aging.current_0_30 += amount
        } else if (daysOverdue <= 60) {
          aging.overdue_31_60 += amount
        } else if (daysOverdue <= 90) {
          aging.overdue_61_90 += amount
        } else {
          aging.overdue_90_plus += amount
        }
      }

      await supabase.from('invoice_aging_snapshots').insert({
        user_id: userId,
        snapshot_date: today.toISOString().split('T')[0],
        ...aging,
      })
    }

    return new Response(JSON.stringify({ success: true, users: uniqueUsers.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
