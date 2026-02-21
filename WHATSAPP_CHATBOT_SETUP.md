# WhatsApp Chatbot Webhook Setup Guide

## Overview
This guide teaches you how to connect your WhatsApp chatbot to receive and respond to customer messages automatically using Supabase Edge Functions.

---

## How It Works (Simple Explanation)

```
Customer sends WhatsApp message
         ↓
Whapi.cloud receives it
         ↓
Whapi.cloud sends to YOUR webhook (Supabase Edge Function)
         ↓
Your function:
  1. Gets the message text
  2. Finds which chatbot to use
  3. Asks Groq AI for response
  4. Sends response back via Whapi.cloud
         ↓
Customer receives AI response
```

---

## Prerequisites

1. ✅ Supabase account (you already have this)
2. ✅ Whapi.cloud account with token (you have: DURNULBh7CQBFgsSePFdryuBlDSMtWq9)
3. ✅ Groq API key (you have this in your database)
4. ⚠️ Supabase CLI installed (we'll install this)

---

## Step 1: Install Supabase CLI

### Windows:
```bash
# Using npm (recommended)
npm install -g supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify installation:
```bash
supabase --version
```

---

## Step 2: Login to Supabase CLI

```bash
# Login to your Supabase account
supabase login

# This will open a browser for authentication
```

---

## Step 3: Link Your Project

```bash
# Navigate to your project folder
cd c:\Users\PC\Desktop\allinoneaia-main

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Find YOUR_PROJECT_REF in Supabase Dashboard:
# Settings > General > Reference ID
```

---

## Step 4: Deploy the Edge Function

```bash
# Deploy the webhook function
supabase functions deploy whatsapp-webhook

# This uploads the function to Supabase cloud
```

After deployment, you'll get a URL like:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook
```

**Save this URL!** You'll need it for Whapi.cloud configuration.

---

## Step 5: Set Environment Variables

The Edge Function needs access to your Supabase database. Set secrets:

```bash
# These are automatically available in Edge Functions:
# - SUPABASE_URL (auto-set)
# - SUPABASE_SERVICE_ROLE_KEY (auto-set)

# No additional secrets needed for this function!
```

---

## Step 6: Run Database Migration

Apply the chat_messages table migration:

```bash
# Push the migration to your database
supabase db push
```

This creates the `chat_messages` table to store conversation history.

**Then add the Whapi token to api_config**:

Run this SQL in Supabase Dashboard (SQL Editor):

```sql
-- Add whapi token if not exists
INSERT INTO api_config (service, api_key)
VALUES ('whapi', 'DURNULBh7CQBFgsSePFdryuBlDSMtWq9')
ON CONFLICT (service) DO UPDATE SET api_key = EXCLUDED.api_key;
```

---

## Step 7: Configure Whapi.cloud Webhook

1. **Go to Whapi.cloud Dashboard**: https://whapi.cloud/
2. **Navigate to**: Settings > Webhooks
3. **Add New Webhook**:
   - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook`
   - **Events**: Select "messages" (incoming messages)
   - **Method**: POST
4. **Save** the webhook

---

## Step 8: Test Your Chatbot

### Create a Test Chatbot:
1. Go to your app: `/chat/whatsapp`
2. Create a new chatbot:
   - **Name**: Customer Support Bot
   - **Platform**: WhatsApp
   - **Instructions**: "You are a helpful customer support assistant. Be friendly and professional."
   - **Knowledge Base**: Add your business info, FAQs, etc.
   - **Model**: llama-3.3-70b-versatile
   - **Active**: ✅ Yes

### Test It:
1. Send a WhatsApp message to your Whapi.cloud number
2. Message: "Hello, what are your business hours?"
3. Wait 2-3 seconds
4. You should receive an AI-generated response!

---

## Step 9: View Conversation History

Check the `chat_messages` table in Supabase to see all conversations:

```sql
SELECT * FROM chat_messages 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## Troubleshooting

### Problem: No response from chatbot

**Check 1**: Verify webhook is receiving messages
```bash
# View Edge Function logs
supabase functions logs whatsapp-webhook
```

**Check 2**: Ensure chatbot is active
- Go to `/chat/whatsapp`
- Make sure "Active" toggle is ON

**Check 3**: Verify API keys
- Groq API key in `api_config` table
- Whapi token in `api_config` table

### Problem: "API key not configured" error

Run this SQL in Supabase:
```sql
-- Check if keys exist
SELECT service, api_key FROM api_config;

-- If missing, add them:
INSERT INTO api_config (service, api_key, user_id)
VALUES 
  ('groq', 'YOUR_GROQ_KEY', 'YOUR_USER_ID'),
  ('whapi', 'DURNULBh7CQBFgsSePFdryuBlDSMtWq9', 'YOUR_USER_ID');
```

### Problem: Webhook not receiving messages

1. **Test webhook manually**:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "from": "2347049163283",
      "body": "Test message",
      "id": "test123"
    }]
  }'
```

2. **Check Whapi.cloud webhook status**:
   - Go to Whapi.cloud Dashboard
   - Check webhook delivery logs
   - Look for failed deliveries

---

## Advanced: Multiple Chatbots

To handle different chatbots for different phone numbers:

1. **Add phone mapping table**:
```sql
CREATE TABLE chatbot_phone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id),
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Update webhook function** to check mapping first before using default chatbot.

---

## Cost Breakdown

- **Supabase Edge Functions**: 500K requests/month FREE
- **Whapi.cloud**: Trial (150 messages/5 chats/5 days), then paid plans
- **Groq API**: FREE tier available (generous limits)

**Total for testing**: $0 🎉

---

## Next Steps

1. ✅ Deploy the Edge Function
2. ✅ Configure Whapi.cloud webhook
3. ✅ Create your first chatbot
4. ✅ Test with a real WhatsApp message
5. 🚀 Scale to handle hundreds of customers!

---

## Support

If you get stuck:
1. Check Edge Function logs: `supabase functions logs whatsapp-webhook`
2. Check Supabase database logs in Dashboard
3. Check Whapi.cloud webhook delivery logs
4. Review the code in `supabase/functions/whatsapp-webhook/index.ts`

---

## Summary

You now have:
- ✅ Webhook endpoint (Supabase Edge Function)
- ✅ Database to store conversations
- ✅ AI integration (Groq)
- ✅ WhatsApp integration (Whapi.cloud)
- ✅ Complete chatbot system

**No website needed!** Everything runs on Supabase's serverless infrastructure.
