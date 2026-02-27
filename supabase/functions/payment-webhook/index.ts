import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gateway, reference, status, signature } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: transaction } = await supabase
      .from('payment_transactions_log')
      .select('*')
      .eq('transaction_reference', reference)
      .single()

    if (!transaction) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase
      .from('payment_transactions_log')
      .update({
        status: status === 'success' ? 'success' : 'failed',
        paid_at: status === 'success' ? new Date().toISOString() : null,
      })
      .eq('transaction_reference', reference)

    if (status === 'success' && transaction.related_invoice_id) {
      await supabase
        .from('invoices')
        .update({ payment_status: 'paid' })
        .eq('id', transaction.related_invoice_id)

      await supabase.from('cashbook_transactions').insert({
        user_id: transaction.user_id,
        type: 'income',
        amount: transaction.amount,
        category: 'Invoice Payment',
        description: `Payment for invoice ${transaction.related_invoice_id}`,
        date: new Date().toISOString().split('T')[0],
        source: 'invoice',
        source_id: transaction.related_invoice_id,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
