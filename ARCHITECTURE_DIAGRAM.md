# Page-Specific AI Agents Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Dashboard │  │  Tasks   │  │Customers │  │  Stock   │ ...  │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │              │              │             │
│       └─────────────┴──────────────┴──────────────┘             │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PageAIAgent Component                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  • Floating Button (Bottom-Right)                     │     │
│  │  • Chat Interface (Minimizable)                       │     │
│  │  • Voice Input (Web Speech API)                       │     │
│  │  • Text Input                                         │     │
│  │  • Message History                                    │     │
│  │  • Loading States                                     │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Page Agent Configurations                      │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  pageAgentConfigs = {                                 │     │
│  │    dashboard: {                                       │     │
│  │      pageName: "Dashboard",                           │     │
│  │      pageContext: "Business overview...",             │     │
│  │      availableActions: [...]                          │     │
│  │    },                                                 │     │
│  │    tasks: { ... },                                    │     │
│  │    customers: { ... },                                │     │
│  │    // ... 16 total configurations                    │     │
│  │  }                                                    │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Processing Layer                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Groq API (Llama 3.3 70B)                 │     │
│  │  • Receives user message + page context               │     │
│  │  • Determines required actions                        │     │
│  │  • Calls appropriate tools                            │     │
│  │  • Returns formatted response                         │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Tool Execution Layer                       │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              ai-agent-tools.ts (60+ tools)            │     │
│  │                                                       │     │
│  │  Business Tools:                                      │     │
│  │  • get_cashbook_summary()                             │     │
│  │  • add_cashbook_entry()                               │     │
│  │  • create_invoice()                                   │     │
│  │  • get_invoices()                                     │     │
│  │                                                       │     │
│  │  Customer Tools:                                      │     │
│  │  • add_customer()                                     │     │
│  │  • get_customers()                                    │     │
│  │  • search_customers()                                 │     │
│  │  • update_customer()                                  │     │
│  │                                                       │     │
│  │  Task Tools:                                          │     │
│  │  • create_task()                                      │     │
│  │  • get_tasks()                                        │     │
│  │  • complete_task()                                    │     │
│  │                                                       │     │
│  │  Stock Tools:                                         │     │
│  │  • add_stock_item()                                   │     │
│  │  • update_stock()                                     │     │
│  │  • get_stock_levels()                                 │     │
│  │                                                       │     │
│  │  Analytics Tools:                                     │     │
│  │  • get_profit_margin()                                │     │
│  │  • get_revenue_comparison()                           │     │
│  │  • get_expense_breakdown()                            │     │
│  │                                                       │     │
│  │  Content Tools:                                       │     │
│  │  • generate_seo_content()                             │     │
│  │  • create_email_campaign()                            │     │
│  │  • create_whatsapp_campaign()                         │     │
│  │                                                       │     │
│  │  ... and 40+ more tools                               │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer (Supabase)                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  Tables:                                              │     │
│  │  • cashbook_transactions                              │     │
│  │  • invoices                                           │     │
│  │  • customers                                          │     │
│  │  • tasks                                              │     │
│  │  • appointments                                       │     │
│  │  • stock                                              │     │
│  │  • reminders                                          │     │
│  │  • staff                                              │     │
│  │  • email_lists                                        │     │
│  │  • scheduled_messages                                 │     │
│  │  ... and more                                         │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Action Flow:
─────────────────

1. USER SPEAKS/TYPES
   │
   ├─→ "Create an invoice for John Doe"
   │
   ▼
2. PageAIAgent Component
   │
   ├─→ Captures input (voice → text or direct text)
   ├─→ Adds to message history
   ├─→ Shows loading state
   │
   ▼
3. Groq API Request
   │
   ├─→ System prompt: "You are an AI assistant for the Invoices page..."
   ├─→ Page context: "Invoice management page..."
   ├─→ Available actions: ["Create invoice", "Mark paid", ...]
   ├─→ User message: "Create an invoice for John Doe"
   ├─→ Tools: [create_invoice, get_customers, ...]
   │
   ▼
4. AI Processing
   │
   ├─→ Analyzes request
   ├─→ Determines: Need to create_invoice
   ├─→ Extracts parameters: customer_name = "John Doe"
   ├─→ Returns: tool_call(create_invoice, {customer_name: "John Doe", ...})
   │
   ▼
5. Tool Execution
   │
   ├─→ executeTool("create_invoice", {...}, userId)
   ├─→ Finds/creates customer in database
   ├─→ Calculates totals
   ├─→ Inserts invoice record
   ├─→ Returns: {success: true, invoice_number: "INV-12345", ...}
   │
   ▼
6. Response to User
   │
   ├─→ Formats result
   ├─→ Displays in chat: "Invoice INV-12345 created for John Doe. Total: $500"
   ├─→ Updates message history
   └─→ Ready for next request
```

## Component Hierarchy

```
App
│
├── Dashboard Page
│   └── PageAIAgent (dashboard config)
│
├── Tasks Page
│   └── PageAIAgent (tasks config)
│
├── Appointments Page
│   └── PageAIAgent (appointments config)
│
├── Customers Page
│   └── PageAIAgent (customers config)
│
├── Stock Page
│   └── PageAIAgent (stock config)
│
├── Business Tools Page
│   ├── PageAIAgent (business config)
│   │
│   ├── Cashbook Sub-page
│   │   └── PageAIAgent (cashbook config)
│   │
│   ├── Invoices Sub-page
│   │   └── PageAIAgent (invoices config)
│   │
│   ├── Staff Sub-page
│   │   └── PageAIAgent (staff config)
│   │
│   └── Reports Sub-page
│       └── PageAIAgent (reports config)
│
├── Automation Page
│   └── PageAIAgent (automation config)
│
├── Chatbot Builder Page
│   └── PageAIAgent (chatbot config)
│
├── Content Studio Page
│   └── PageAIAgent (content config)
│
├── Growth Services Page
│   └── PageAIAgent (growth config)
│
├── Social Media Manager Page
│   └── PageAIAgent (social config)
│
└── Reminders Page
    └── PageAIAgent (reminders config)
```

## State Management Flow

```
PageAIAgent Component State:
────────────────────────────

┌─────────────────────────────────────┐
│  Component State                    │
│  ┌───────────────────────────────┐  │
│  │ isOpen: boolean               │  │
│  │ isMinimized: boolean          │  │
│  │ messages: Message[]           │  │
│  │ input: string                 │  │
│  │ isLoading: boolean            │  │
│  │ isListening: boolean          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         ├─→ User clicks button
         │   └─→ isOpen = true
         │
         ├─→ User types message
         │   └─→ input = "user text"
         │
         ├─→ User clicks mic
         │   └─→ isListening = true
         │   └─→ Speech API captures
         │   └─→ input = "transcribed text"
         │
         ├─→ User submits
         │   └─→ isLoading = true
         │   └─→ messages.push({role: 'user', ...})
         │   └─→ Call Groq API
         │   └─→ Execute tools
         │   └─→ messages.push({role: 'assistant', ...})
         │   └─→ isLoading = false
         │
         └─→ User minimizes
             └─→ isMinimized = true
```

## Integration Points

```
External Services:
─────────────────

┌──────────────────┐
│   Groq API       │ ← AI Processing
│  (Llama 3.3 70B) │
└──────────────────┘
         ▲
         │
         │
┌────────┴─────────┐
│  PageAIAgent     │
└────────┬─────────┘
         │
         ├─→ ┌──────────────────┐
         │   │  Web Speech API  │ ← Voice Recognition
         │   └──────────────────┘
         │
         ├─→ ┌──────────────────┐
         │   │    Supabase      │ ← Database Operations
         │   └──────────────────┘
         │
         └─→ ┌──────────────────┐
             │  Auth Context    │ ← User Authentication
             └──────────────────┘
```

## File Structure

```
src/
├── components/
│   └── PageAIAgent.tsx          ← Main AI agent component
│
├── lib/
│   ├── page-agent-configs.ts    ← Page configurations
│   ├── ai-agent-tools.ts        ← Tool definitions & execution
│   └── supabase.ts              ← Database client
│
├── hooks/
│   └── use-page-ai-agent.tsx    ← Helper hook
│
└── pages/
    ├── Dashboard.tsx            ← ✅ Integrated
    ├── BusinessToolsPage.tsx    ← ✅ Integrated
    ├── RemindersPage.tsx        ← ✅ Integrated
    ├── AutomationPage.tsx       ← ✅ Integrated
    ├── TasksPage.tsx            ← Ready to integrate
    ├── AppointmentsPage.tsx     ← Ready to integrate
    ├── CustomersPage.tsx        ← Ready to integrate
    └── ... (other pages)        ← Ready to integrate

docs/
├── PAGE_AI_AGENTS_GUIDE.md           ← Comprehensive guide
├── QUICK_IMPLEMENTATION_GUIDE.md     ← Quick start
├── IMPLEMENTATION_SUMMARY.md         ← Summary
└── ARCHITECTURE_DIAGRAM.md           ← This file
```

## Tool Categories

```
60+ Tools Organized by Category:
────────────────────────────────

Business & Finance (15 tools)
├── Cashbook operations
├── Invoice management
├── Financial reports
└── Profit calculations

Customer Management (8 tools)
├── CRUD operations
├── Search & filter
├── Payment history
└── Top customers

Task Management (6 tools)
├── Create & update
├── Priority filtering
├── Completion tracking
└── Overdue detection

Appointment Management (5 tools)
├── Scheduling
├── Rescheduling
├── Cancellation
└── Calendar views

Stock Management (7 tools)
├── Inventory tracking
├── Stock alerts
├── Value calculation
└── Best sellers

Staff Management (4 tools)
├── Employee database
├── Payroll calculation
├── Position filtering
└── Attendance tracking

Analytics & Reports (10 tools)
├── Revenue comparison
├── Expense breakdown
├── Profit margins
├── Monthly trends
└── Cash flow analysis

Content & Marketing (5 tools)
├── SEO content generation
├── Email campaigns
├── WhatsApp campaigns
└── Contact list management
```

## Security Architecture

```
Security Layers:
───────────────

┌─────────────────────────────────────┐
│  1. Authentication Layer            │
│     • User must be logged in        │
│     • Session validation            │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  2. Authorization Layer             │
│     • User ID verification          │
│     • RLS policies on database      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  3. API Security                    │
│     • API keys in environment       │
│     • HTTPS required                │
│     • Rate limiting                 │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  4. Data Security                   │
│     • No PII in AI prompts          │
│     • Sanitized inputs              │
│     • Encrypted storage             │
└─────────────────────────────────────┘
```

## Performance Optimization

```
Optimization Strategies:
───────────────────────

1. Lazy Loading
   └─→ AI agent loads only when needed

2. Minimal Re-renders
   └─→ Optimized state management

3. Efficient API Calls
   └─→ Batched database operations

4. Smart Caching
   └─→ Page context cached

5. Async Operations
   └─→ Non-blocking UI updates
```

---

This architecture provides a scalable, maintainable, and user-friendly AI agent system that enhances every page of your application.
