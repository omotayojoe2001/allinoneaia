# Reminder Automation Setup Guide

## Overview
This phase adds automatic reminder creation from invoices/appointments/stock, email/WhatsApp notifications, and background job processing.

## Database Setup

### 1. Run Migration
Execute the SQL migration in Supabase SQL Editor:
```sql
-- Run: supabase/migrations/013_reminder_automation.sql
```

This creates:
- Auto-reminder trigger functions for invoices, appointments, and stock
- Background job processing functions
- Notification logging system

### 2. Configure API Keys

Add Resend and WhatsApp API keys to `api_config` table:

```sql
-- Resend API Key (for email)
INSERT INTO api_config (service_name, api_key, user_id)
VALUES ('resend', 'YOUR_RESEND_API_KEY', auth.uid())
ON CONFLICT (service_name, user_id) 
DO UPDATE SET api_key = 'YOUR_RESEND_API_KEY';

-- WhatsApp API Key (Meta Business API)
INSERT INTO api_config (service_name, api_key, user_id)
VALUES ('whatsapp', 'YOUR_WHATSAPP_ACCESS_TOKEN', auth.uid())
ON CONFLICT (service_name, user_id) 
DO UPDATE SET api_key = 'YOUR_WHATSAPP_ACCESS_TOKEN';
```

## How It Works

### Auto-Reminder Creation

**Invoices:**
- Trigger: When new invoice is created with status='pending' and due_date set
- Reminder: Created at (due_date - advance_minutes)
- Priority: Based on amount (>$10k=urgent, >$5k=high, else=medium)
- Includes: Invoice number, customer name, amount

**Appointments:**
- Trigger: When new appointment is created (not cancelled)
- Reminder: Created at (appointment_date - advance_minutes)
- Priority: Based on time until appointment (<24h=urgent, <3d=high, else=medium)
- Includes: Client name, date, time, location

**Stock:**
- Trigger: When inventory quantity drops to/below reorder_level
- Reminder: Created immediately + advance_minutes
- Priority: Based on quantity (0=urgent, <50% reorder=high, else=medium)
- Includes: Product name, current quantity, reorder level, SKU

### Notification Sending

**Email (Resend):**
- Sends HTML formatted emails
- Includes reminder title, description, category
- Logs success/failure to reminder_notifications table

**WhatsApp (Meta Business API):**
- Sends text messages via WhatsApp Business API
- Formats message with title, description, category
- Requires phone number in international format

**In-App:**
- Stores notification in database
- Can be displayed in UI notification center

### Background Scheduler

- Runs every 60 seconds
- Checks for reminders where due_date <= NOW() and status='pending'
- Sends notifications based on user's reminder_settings
- Marks reminders as 'sent' after processing
- Logs all notification attempts

## Configuration

### User Reminder Settings

Users can configure per-category settings in RemindersPage:
- Enable/disable category
- Advance time (minutes before due date)
- Notification channels (email, SMS/WhatsApp, push)
- Repeat settings

### WhatsApp Setup

1. Create Meta Business Account
2. Set up WhatsApp Business API
3. Get Phone Number ID and Access Token
4. Update notification-service.ts line 88:
   ```typescript
   const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
   ```

### Resend Setup

1. Sign up at resend.com
2. Verify your domain
3. Get API key
4. Update notification-service.ts line 35 with your verified domain:
   ```typescript
   from: 'Reminders <reminders@yourdomain.com>',
   ```

## Testing

### Test Auto-Reminder Creation

```sql
-- Test invoice reminder
INSERT INTO invoices (user_id, invoice_number, customer_name, customer_email, total_amount, due_date, status)
VALUES (auth.uid(), 'INV-001', 'Test Customer', 'test@example.com', 5000, NOW() + INTERVAL '7 days', 'pending');

-- Check if reminder was created
SELECT * FROM reminders WHERE category = 'invoice' ORDER BY created_at DESC LIMIT 1;
```

### Test Manual Processing

```typescript
import { processPendingReminders } from '@/lib/notification-service';

// Call manually
await processPendingReminders();
```

### Check Logs

```sql
-- View notification logs
SELECT 
  r.title,
  rn.notification_type,
  rn.status,
  rn.sent_at,
  rn.error_message
FROM reminder_notifications rn
JOIN reminders r ON r.id = rn.reminder_id
WHERE r.user_id = auth.uid()
ORDER BY rn.sent_at DESC;
```

## Architecture

```
┌─────────────────┐
│ Invoice/Appt/   │
│ Stock Created   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database Trigger│
│ Fires           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto-Create     │
│ Reminder        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Background      │
│ Scheduler       │
│ (Every 60s)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Pending   │
│ Reminders       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send Email/     │
│ WhatsApp/Push   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Mark as Sent    │
│ Log Result      │
└─────────────────┘
```

## Files Created

1. **supabase/migrations/013_reminder_automation.sql**
   - Auto-reminder trigger functions
   - Background processing functions
   - Notification logging

2. **src/lib/notification-service.ts**
   - Email sending (Resend)
   - WhatsApp sending (Meta API)
   - Push notifications
   - Reminder processing logic

3. **src/components/ReminderScheduler.tsx**
   - Background job scheduler
   - Runs every 60 seconds
   - Processes pending reminders

4. **REMINDER_AUTOMATION_SETUP.md**
   - This documentation file

## Next Steps

1. Run SQL migration in Supabase
2. Add Resend and WhatsApp API keys
3. Configure WhatsApp Phone Number ID
4. Verify Resend domain
5. Test with sample invoice/appointment/stock
6. Monitor notification logs

## Troubleshooting

**Reminders not being created:**
- Check if reminder_settings exist for user and category
- Verify category is enabled in settings
- Check trigger conditions (invoice status, appointment not cancelled, etc.)

**Notifications not sending:**
- Verify API keys in api_config table
- Check notification logs for error messages
- Ensure recipient email/phone is valid
- Verify Resend domain is verified
- Check WhatsApp Phone Number ID is correct

**Scheduler not running:**
- Check browser console for errors
- Verify ReminderScheduler is mounted in App.tsx
- Check if processPendingReminders() is being called
