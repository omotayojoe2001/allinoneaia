# WhatsApp Chatbot Quick Reference

## Essential Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy webhook
supabase functions deploy whatsapp-webhook

# View logs (real-time)
supabase functions logs whatsapp-webhook --follow

# Push database changes
supabase db push
```

---

## Your Webhook URL Format

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID.

---

## Whapi.cloud Webhook Configuration

**URL**: Your webhook URL above  
**Method**: POST  
**Events**: messages (incoming messages)  
**Headers**: None needed

---

## Test Webhook Manually

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "from": "2347049163283",
      "body": "Hello",
      "id": "test123"
    }]
  }'
```

---

## Check API Keys in Database

```sql
-- View all API keys
SELECT service, api_key FROM api_config;

-- Add missing keys
INSERT INTO api_config (service, api_key, user_id)
VALUES ('whapi', 'DURNULBh7CQBFgsSePFdryuBlDSMtWq9', 'YOUR_USER_ID');
```

---

## View Conversation History

```sql
-- Last 20 messages
SELECT 
  phone_number,
  role,
  content,
  created_at
FROM chat_messages 
ORDER BY created_at DESC 
LIMIT 20;

-- Messages from specific phone
SELECT * FROM chat_messages 
WHERE phone_number = '2347049163283'
ORDER BY created_at DESC;
```

---

## Troubleshooting Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Edge Function deployed successfully
- [ ] Whapi.cloud webhook configured with correct URL
- [ ] Chatbot created and marked as "Active"
- [ ] Groq API key exists in api_config table
- [ ] Whapi token exists in api_config table
- [ ] Database migration applied (chat_messages table exists)

---

## Common Errors & Fixes

### "No active WhatsApp chatbot found"
→ Create a chatbot at `/chat/whatsapp` and toggle "Active" ON

### "API key not configured"
→ Check api_config table has 'groq' and 'whapi' entries

### "Webhook not receiving messages"
→ Check Whapi.cloud webhook delivery logs
→ Verify webhook URL is correct
→ Test webhook manually with curl command

### "Function deployment failed"
→ Check you're in the correct directory
→ Verify supabase/functions/whatsapp-webhook/index.ts exists
→ Run `supabase link` again

---

## File Locations

- **Edge Function**: `supabase/functions/whatsapp-webhook/index.ts`
- **Migration**: `supabase/migrations/015_chat_messages.sql`
- **Setup Guide**: `WHATSAPP_CHATBOT_SETUP.md`
- **This File**: `WHATSAPP_QUICK_REF.md`

---

## Flow Diagram

```
Customer → WhatsApp → Whapi.cloud → Your Webhook → Groq AI → Response → Whapi.cloud → Customer
```

---

## Important URLs

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Whapi.cloud Dashboard**: https://whapi.cloud/
- **Groq Console**: https://console.groq.com/
- **Your App**: http://localhost:8080 (development)

---

## Support Resources

1. **View logs**: `supabase functions logs whatsapp-webhook`
2. **Supabase Docs**: https://supabase.com/docs/guides/functions
3. **Whapi Docs**: https://whapi.cloud/docs
4. **Groq Docs**: https://console.groq.com/docs

---

## Next Actions

1. ✅ Install Supabase CLI
2. ✅ Deploy Edge Function
3. ✅ Configure Whapi webhook
4. ✅ Test with real message
5. 🎉 Celebrate working chatbot!
