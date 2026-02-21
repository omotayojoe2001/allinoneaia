# WhatsApp Chatbot System Architecture

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER SIDE                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    Customer sends: "What are your hours?"
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         WHAPI.CLOUD                                  │
│  • Receives WhatsApp message                                         │
│  • Formats it as JSON                                                │
│  • Sends POST request to your webhook                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    POST /functions/v1/whatsapp-webhook
                    {
                      "messages": [{
                        "from": "2347049163283",
                        "body": "What are your hours?",
                        "id": "msg_123"
                      }]
                    }
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTION                             │
│                   (Your Webhook Handler)                             │
│                                                                       │
│  Step 1: Parse incoming message                                      │
│  ├─ Extract phone number: "2347049163283"                           │
│  ├─ Extract message text: "What are your hours?"                    │
│  └─ Extract message ID: "msg_123"                                   │
│                                                                       │
│  Step 2: Query database for active chatbot                          │
│  ├─ SELECT * FROM chatbots                                          │
│  │   WHERE platform = 'whatsapp'                                    │
│  │   AND is_active = true                                           │
│  └─ Get: name, instructions, knowledge_base, model, temperature     │
│                                                                       │
│  Step 3: Get conversation history                                   │
│  ├─ SELECT * FROM chat_messages                                     │
│  │   WHERE phone_number = "2347049163283"                           │
│  │   ORDER BY created_at DESC LIMIT 10                              │
│  └─ Build context: [previous messages...]                           │
│                                                                       │
│  Step 4: Get Groq API key                                           │
│  ├─ SELECT api_key FROM api_config                                  │
│  │   WHERE service = 'groq'                                         │
│  └─ Key: gsk_7S4wBpr0qYGxHsLAh8xsWGdyb3FYDfyG...                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    POST https://api.groq.com/openai/v1/chat/completions
                    {
                      "model": "llama-3.3-70b-versatile",
                      "messages": [
                        {
                          "role": "system",
                          "content": "You are a helpful assistant..."
                        },
                        {
                          "role": "user",
                          "content": "What are your hours?"
                        }
                      ]
                    }
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GROQ AI                                      │
│  • Processes message with chatbot instructions                       │
│  • Uses knowledge base for context                                   │
│  • Generates intelligent response                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    Response: "We're open Monday-Friday, 9 AM - 6 PM"
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTION                             │
│                   (Continued...)                                     │
│                                                                       │
│  Step 5: Save messages to database                                  │
│  ├─ INSERT INTO chat_messages (user message)                        │
│  │   { role: "user", content: "What are your hours?" }              │
│  └─ INSERT INTO chat_messages (AI response)                         │
│      { role: "assistant", content: "We're open..." }                │
│                                                                       │
│  Step 6: Get Whapi token                                            │
│  ├─ SELECT api_key FROM api_config                                  │
│  │   WHERE service = 'whapi'                                        │
│  └─ Token: DURNULBh7CQBFgsSePFdryuBlDSMtWq9                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    POST https://gate.whapi.cloud/messages/text
                    {
                      "to": "2347049163283",
                      "body": "We're open Monday-Friday, 9 AM - 6 PM"
                    }
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         WHAPI.CLOUD                                  │
│  • Receives response from your webhook                               │
│  • Sends message to customer via WhatsApp                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER SIDE                                │
│  Customer receives: "We're open Monday-Friday, 9 AM - 6 PM"         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Tables Involved

### 1. chatbots
```sql
id              | UUID
user_id         | UUID
name            | TEXT (e.g., "Customer Support Bot")
platform        | TEXT (e.g., "whatsapp")
instructions    | TEXT (e.g., "You are a helpful assistant...")
knowledge_base  | TEXT (e.g., "Business hours: 9-6...")
model           | TEXT (e.g., "llama-3.3-70b-versatile")
temperature     | FLOAT (e.g., 0.7)
is_active       | BOOLEAN (true/false)
```

### 2. chat_messages
```sql
id              | UUID
chatbot_id      | UUID (references chatbots)
phone_number    | TEXT (e.g., "2347049163283")
role            | TEXT ("user" or "assistant")
content         | TEXT (the message)
message_id      | TEXT (WhatsApp message ID)
created_at      | TIMESTAMP
```

### 3. api_config
```sql
service         | TEXT ("groq" or "whapi")
api_key         | TEXT (the API key/token)
user_id         | UUID
```

---

## What Happens in Each Component

### Whapi.cloud (External Service)
- **Receives**: WhatsApp messages from customers
- **Sends**: POST request to your webhook
- **Receives**: Your AI response
- **Sends**: Response back to customer via WhatsApp

### Supabase Edge Function (Your Code)
- **Receives**: Webhook from Whapi.cloud
- **Queries**: Database for chatbot config and history
- **Calls**: Groq AI for intelligent response
- **Saves**: Conversation to database
- **Sends**: Response back to Whapi.cloud

### Groq AI (External Service)
- **Receives**: Message + chatbot instructions + history
- **Processes**: Using AI model (Llama 3.3)
- **Returns**: Intelligent response

### Your Database (Supabase)
- **Stores**: Chatbot configurations
- **Stores**: Conversation history
- **Stores**: API keys/tokens

---

## Time Flow (Typical Response Time)

```
Customer sends message
    ↓ (instant)
Whapi.cloud receives
    ↓ (< 100ms)
Your webhook receives
    ↓ (< 200ms)
Database queries complete
    ↓ (1-2 seconds)
Groq AI generates response
    ↓ (< 100ms)
Save to database
    ↓ (< 100ms)
Send via Whapi.cloud
    ↓ (instant)
Customer receives response

Total: ~2-3 seconds
```

---

## Cost Per Message

```
Customer message → Your webhook: FREE (Supabase)
Database queries: FREE (within limits)
Groq AI call: FREE (generous free tier)
Send response: Depends on Whapi.cloud plan
Database storage: FREE (within limits)

Total per message: ~$0.00 (on free tiers)
```

---

## Scaling Capacity

- **Supabase Edge Functions**: 500K requests/month FREE
- **Database**: 500MB FREE, unlimited rows
- **Groq API**: Generous free tier
- **Whapi.cloud**: Depends on your plan

**Can handle**: Hundreds of conversations simultaneously!

---

## Security Features

✅ **HTTPS**: All communication encrypted  
✅ **RLS**: Row Level Security on database  
✅ **API Keys**: Stored securely in database  
✅ **Service Role**: Edge Function uses service role key  
✅ **CORS**: Configured for security  

---

## Monitoring & Debugging

```bash
# Real-time logs
supabase functions logs whatsapp-webhook --follow

# View recent conversations
SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 20;

# Check webhook health
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook
```

---

## Summary

**You built**: A serverless, AI-powered WhatsApp chatbot  
**No server needed**: Runs on Supabase Edge Functions  
**No website needed**: Direct webhook integration  
**Fully automated**: Responds 24/7 without human intervention  
**Scalable**: Handles multiple conversations simultaneously  
**Cost**: FREE for testing and small-scale use  

🎉 **You're now a chatbot developer!**
