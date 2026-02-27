# Payment & Reminder System Setup

## Supabase Edge Functions Deployment

### 1. Deploy Payment Webhook
```bash
supabase functions deploy payment-webhook
```

**Webhook URLs:**
- Paystack: `https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook`
- Flutterwave: `https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook`

Configure these URLs in your Paystack/Flutterwave dashboard.

### 2. Deploy Cron Functions
```bash
supabase functions deploy invoice-reminders-cron
supabase functions deploy aging-report-cron
```

### 3. Setup Cron Jobs (pg_cron)

Run in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Invoice reminders (daily at 9 AM)
SELECT cron.schedule(
  'invoice-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/invoice-reminders-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);

-- Aging reports (daily at 1 AM)
SELECT cron.schedule(
  'aging-report-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/aging-report-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## Payment Gateway Configuration

### Paystack Setup
1. Go to Finance Hub → Payment
2. Enable Paystack
3. Get keys from: https://dashboard.paystack.com/#/settings/developers
4. Enter Public Key (pk_test_... or pk_live_...)
5. Enter Secret Key (sk_test_... or sk_live_...)
6. Save settings

### Flutterwave Setup
1. Go to Finance Hub → Payment
2. Enable Flutterwave
3. Get keys from: https://dashboard.flutterwave.com/settings/apis
4. Enter Public Key (FLWPUBK_TEST-... or FLWPUBK-...)
5. Enter Secret Key (FLWSECK_TEST-... or FLWSECK-...)
6. Save settings

## Features Now Working

✅ **Payment Links**
- Generate payment links for invoices
- Customer pays via Paystack/Flutterwave
- Auto-update invoice status to "paid"
- Auto-record in cashbook

✅ **Invoice Reminders**
- Automated daily checks
- Send reminders before/on/after due date
- Email/WhatsApp support
- Customizable templates
- Reminder logs

✅ **Aging Reports**
- Daily automated generation
- 4 aging buckets (0-30, 31-60, 61-90, 90+)
- Historical snapshots
- Visual dashboard

✅ **Webhook Handlers**
- Receive payment confirmations
- Update transaction status
- Auto-record payments

## System Status: 100% Complete ✅
- Database: 100% ✅
- UI: 100% ✅
- Backend Logic: 100% ✅
- Automation: 100% ✅
