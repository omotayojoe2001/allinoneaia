# Complete System Architecture & Implementation Guide

## PROJECT OVERVIEW
This document provides a complete blueprint for replicating the BizSuiteAI platform's core functionalities (WhatsApp Chatbot, Email Automation, Scheduling, AI Agent) to an admin panel while keeping AI Agent on the frontend for all users.

---

## PART 1: SYSTEM ARCHITECTURE

### Current Structure
```
Frontend (User-Facing)
├── AI Agent (Public - all users)
├── Dashboard
├── Chat Interface
└── Settings

Admin Panel (New - to be created)
├── WhatsApp Chatbot Management
├── Email Automation
├── Scheduling
├── User Management
└── Analytics
```

### Database Schema Required
```sql
-- Core Tables
- users (id, email, password, role, created_at)
- api_config (id, service, api_key, user_id, created_at)
- whatsapp_chatbots (id, name, phone_number, status, user_id)
- whatsapp_messages (id, chatbot_id, from, to, message, timestamp)
- email_campaigns (id, name, recipients, subject, body, status, user_id)
- scheduled_messages (id, user_id, target_type, target_phone, message_body, scheduled_time, status)
- automation_rules (id, name, trigger, action, user_id, enabled)
```

---

## PART 2: CORE PAGES & COMPONENTS

### 1. WHATSAPP CHATBOT MANAGEMENT

**File: `src/pages/admin/WhatsAppChatbotManager.tsx`**

Key Features:
- Create/Edit/Delete chatbots
- Configure bot responses
- View conversation history
- Analytics dashboard

Required Dependencies:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "lucide-react": "latest",
    "tailwindcss": "^3.x"
  }
}
```

**Database Queries Needed:**
```typescript
// Create chatbot
INSERT INTO whatsapp_chatbots (name, phone_number, status, user_id)
VALUES (?, ?, 'active', ?)

// Get chatbot messages
SELECT * FROM whatsapp_messages 
WHERE chatbot_id = ? 
ORDER BY timestamp DESC

// Update chatbot settings
UPDATE whatsapp_chatbots 
SET name = ?, status = ? 
WHERE id = ? AND user_id = ?
```

---

### 2. EMAIL AUTOMATION

**File: `src/pages/admin/EmailAutomationManager.tsx`**

Key Features:
- Create email campaigns
- Schedule emails
- Template builder
- Recipient management
- Delivery tracking

**Database Queries:**
```typescript
// Create campaign
INSERT INTO email_campaigns (name, recipients, subject, body, status, user_id)
VALUES (?, ?, ?, ?, 'draft', ?)

// Get campaign stats
SELECT COUNT(*) as total, 
       SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as sent,
       SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
FROM email_campaigns WHERE user_id = ?
```

---

### 3. MESSAGE SCHEDULING

**File: `src/pages/admin/ScheduledMessagesManager.tsx`**

Key Features:
- Schedule WhatsApp messages
- Schedule emails
- Recurring schedules
- Calendar view

**Database Queries:**
```typescript
// Create scheduled message
INSERT INTO scheduled_messages 
(user_id, target_type, target_phone, message_body, scheduled_time, status)
VALUES (?, ?, ?, ?, ?, 'pending')

// Get pending messages
SELECT * FROM scheduled_messages 
WHERE status = 'pending' AND scheduled_time <= NOW()
```

---

### 4. AUTOMATION RULES ENGINE

**File: `src/pages/admin/AutomationRulesManager.tsx`**

Key Features:
- Create if/then rules
- Trigger types (message received, time-based, etc.)
- Action types (send message, send email, etc.)
- Rule testing

**Database Queries:**
```typescript
// Create rule
INSERT INTO automation_rules (name, trigger, action, user_id, enabled)
VALUES (?, ?, ?, ?, true)

// Get active rules
SELECT * FROM automation_rules 
WHERE user_id = ? AND enabled = true
```

---

## PART 3: API INTEGRATIONS

### Required External Services & Configuration

#### 1. WHATSAPP INTEGRATION (Whapi.cloud)
```typescript
// Service: Whapi.cloud
// Endpoint: https://gate.whapi.cloud/

// Required Configuration:
const WHAPI_CONFIG = {
  baseUrl: 'https://gate.whapi.cloud',
  endpoints: {
    sendMessage: '/messages/text',
    getMessages: '/messages',
    getChats: '/chats',
    uploadMedia: '/media/upload'
  }
}

// Headers needed:
{
  'Authorization': `Bearer ${WHAPI_TOKEN}`,
  'Content-Type': 'application/json'
}

// Store WHAPI_TOKEN in: supabase.api_config table
```

#### 2. EMAIL SERVICE (Resend or SendGrid)
```typescript
// Option A: Resend
const RESEND_CONFIG = {
  baseUrl: 'https://api.resend.com',
  endpoint: '/emails',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  }
}

// Option B: SendGrid
const SENDGRID_CONFIG = {
  baseUrl: 'https://api.sendgrid.com/v3',
  endpoint: '/mail/send',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  }
}

// Store in: supabase.api_config table
```

#### 3. AI/LLM SERVICES
```typescript
// Groq API (for AI responses)
const GROQ_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  endpoint: '/chat/completions',
  model: 'mixtral-8x7b-32768',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
}

// Store in: supabase.api_config table
```

#### 4. PAYMENT PROCESSING
```typescript
// Paystack
const PAYSTACK_CONFIG = {
  baseUrl: 'https://api.paystack.co',
  publicKey: 'pk_live_xxxxx',
  secretKey: 'sk_live_xxxxx' // Store securely in Supabase
}

// Flutterwave
const FLUTTERWAVE_CONFIG = {
  baseUrl: 'https://api.flutterwave.com/v3',
  publicKey: 'pk_live_xxxxx',
  secretKey: 'sk_live_xxxxx' // Store securely in Supabase
}
```

---

## PART 4: CRITICAL SERVICES & UTILITIES

### 1. WhatsApp Service
**File: `src/lib/whatsapp-service.ts`**

```typescript
export class WhatsAppService {
  private apiKey: string;
  private baseUrl = 'https://gate.whapi.cloud';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(to: string, message: string) {
    // Implementation
  }

  async getMessages(chatId: string) {
    // Implementation
  }

  async uploadMedia(file: File) {
    // Implementation
  }

  async getChatList() {
    // Implementation
  }
}
```

### 2. Email Service
**File: `src/lib/email-service.ts`**

```typescript
export class EmailService {
  private apiKey: string;
  private provider: 'resend' | 'sendgrid';

  constructor(apiKey: string, provider: 'resend' | 'sendgrid') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async sendEmail(to: string, subject: string, html: string) {
    // Implementation
  }

  async sendBulkEmails(recipients: string[], subject: string, html: string) {
    // Implementation
  }

  async getDeliveryStatus(messageId: string) {
    // Implementation
  }
}
```

### 3. Scheduling Service
**File: `src/lib/scheduling-service.ts`**

```typescript
export class SchedulingService {
  async scheduleMessage(
    userId: string,
    targetType: 'whatsapp' | 'email',
    target: string,
    message: string,
    scheduledTime: Date
  ) {
    // Implementation
  }

  async getScheduledMessages(userId: string) {
    // Implementation
  }

  async cancelScheduledMessage(messageId: string) {
    // Implementation
  }

  async processScheduledMessages() {
    // Cron job to send pending messages
  }
}
```

### 4. Automation Rules Engine
**File: `src/lib/automation-engine.ts`**

```typescript
export class AutomationEngine {
  async createRule(rule: AutomationRule) {
    // Implementation
  }

  async executeRule(rule: AutomationRule, trigger: any) {
    // Implementation
  }

  async processIncomingMessage(message: any) {
    // Check all active rules and execute matching ones
  }
}
```

---

## PART 5: ADMIN PANEL STRUCTURE

### Directory Structure
```
src/
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── WhatsAppChatbotManager.tsx
│   │   ├── EmailAutomationManager.tsx
│   │   ├── ScheduledMessagesManager.tsx
│   │   ├── AutomationRulesManager.tsx
│   │   ├── UserManagement.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   └── SettingsPanel.tsx
│   └── ...
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── ChatbotCard.tsx
│   │   ├── CampaignBuilder.tsx
│   │   ├── ScheduleCalendar.tsx
│   │   └── RuleBuilder.tsx
│   └── ...
├── lib/
│   ├── whatsapp-service.ts
│   ├── email-service.ts
│   ├── scheduling-service.ts
│   ├── automation-engine.ts
│   └── supabase.ts
└── ...
```

---

## PART 6: AUTHENTICATION & AUTHORIZATION

### Admin Role Check
```typescript
// Middleware to protect admin routes
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    };

    checkAdmin();
  }, [user]);

  if (!isAdmin) return <Navigate to="/dashboard" />;
  return children;
};
```

---

## PART 7: ENVIRONMENT VARIABLES NEEDED

Create `.env` file with:
```
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# WhatsApp (Whapi.cloud)
VITE_WHAPI_TOKEN=your_whapi_token

# Email Service
VITE_RESEND_API_KEY=your_resend_key
# OR
VITE_SENDGRID_API_KEY=your_sendgrid_key

# AI/LLM
VITE_GROQ_API_KEY=your_groq_key
VITE_OPENAI_API_KEY=your_openai_key

# Payment
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
```

---

## PART 8: IMPLEMENTATION CHECKLIST

### Phase 1: Setup
- [ ] Create admin panel folder structure
- [ ] Set up Supabase tables
- [ ] Configure environment variables
- [ ] Create admin authentication

### Phase 2: WhatsApp Integration
- [ ] Implement WhatsApp service
- [ ] Create chatbot manager page
- [ ] Add message history view
- [ ] Implement webhook for incoming messages

### Phase 3: Email Automation
- [ ] Implement email service
- [ ] Create campaign builder
- [ ] Add template system
- [ ] Implement delivery tracking

### Phase 4: Scheduling
- [ ] Create scheduling service
- [ ] Build calendar UI
- [ ] Implement cron jobs
- [ ] Add recurring schedules

### Phase 5: Automation Rules
- [ ] Build rule builder UI
- [ ] Implement rule engine
- [ ] Add trigger/action system
- [ ] Create rule testing interface

### Phase 6: Analytics & Monitoring
- [ ] Create analytics dashboard
- [ ] Add message statistics
- [ ] Implement campaign reports
- [ ] Add user activity logs

---

## PART 9: KEY INTEGRATION POINTS

### Webhook Handlers (Supabase Edge Functions)
```typescript
// supabase/functions/whatsapp-webhook/index.ts
// Receives incoming WhatsApp messages
// Triggers automation rules
// Stores messages in database

// supabase/functions/email-webhook/index.ts
// Receives email delivery status
// Updates campaign statistics

// supabase/functions/scheduled-messages-processor/index.ts
// Runs every minute
// Sends pending scheduled messages
```

---

## PART 10: SECURITY CONSIDERATIONS

1. **API Keys**: Store all in Supabase `api_config` table, never in code
2. **Rate Limiting**: Implement on all endpoints
3. **Input Validation**: Validate all user inputs
4. **CORS**: Configure properly for admin panel
5. **Audit Logs**: Log all admin actions
6. **Encryption**: Encrypt sensitive data at rest

---

## PART 11: TESTING CHECKLIST

- [ ] WhatsApp message sending/receiving
- [ ] Email campaign delivery
- [ ] Message scheduling accuracy
- [ ] Automation rule execution
- [ ] User permission checks
- [ ] Error handling
- [ ] Performance under load

---

## PART 12: DEPLOYMENT NOTES

1. Deploy admin panel to separate subdomain (admin.platform.com)
2. Use environment variables for all credentials
3. Set up monitoring and alerting
4. Configure backup strategy
5. Set up CI/CD pipeline
6. Test thoroughly in staging first

---

## NEXT STEPS FOR YOUR DEVELOPER

1. Review this entire document
2. Set up the database schema
3. Create the admin panel folder structure
4. Implement services one by one
5. Test each integration
6. Deploy to staging
7. Get your approval before production

---

## SUPPORT RESOURCES

- Supabase Docs: https://supabase.com/docs
- Whapi.cloud Docs: https://whapi.cloud/docs
- Resend Docs: https://resend.com/docs
- SendGrid Docs: https://docs.sendgrid.com
- Groq Docs: https://console.groq.com/docs

---

**Document Version**: 1.0
**Last Updated**: 2024
**Status**: Ready for Implementation
