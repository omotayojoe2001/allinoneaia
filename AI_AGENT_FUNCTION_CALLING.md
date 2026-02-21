# AI Agent with Function Calling

## Overview
The AI Agent now has access to your business data and can perform actions on your behalf using Groq's function calling capability.

## What It Can Do

### Query Data
- **Cashbook**: "What's my cashbook balance?" / "Show me expenses from last 7 days"
- **Invoices**: "Show me pending invoices" / "List my overdue invoices"
- **Stock**: "What items are low in stock?" / "Show me all inventory"
- **Appointments**: "What appointments do I have this week?"
- **Sales**: "What are my sales this month?" / "Show me today's sales"

### Perform Actions
- **Add Cashbook Entry**: "Add a sale of $500 for product X" / "Record an expense of $200 for rent"
- **Create Reminder**: "Remind me to call John tomorrow at 3pm"

## How It Works

1. **User asks question** → "What's my cashbook balance?"
2. **Groq analyzes intent** → Decides to call `get_cashbook_summary` tool
3. **Tool executes** → Queries Supabase database for user's cashbook data
4. **Groq formats response** → "Your cashbook balance for the last 30 days is $5,420. You have $8,200 in income and $2,780 in expenses."

## Available Tools

### 1. get_cashbook_summary
Gets income, expenses, and balance for a time period.
```
"What's my cashbook balance?"
"Show me last 7 days cashbook"
```

### 2. add_cashbook_entry
Adds income or expense to cashbook.
```
"Add a sale of $500 for Product X"
"Record an expense of $200 for rent"
```

### 3. get_invoices
Lists invoices with optional status filter.
```
"Show me pending invoices"
"List all paid invoices"
```

### 4. get_stock_levels
Shows inventory levels, can filter low stock.
```
"What items are low in stock?"
"Show me all inventory"
```

### 5. get_appointments
Lists upcoming appointments.
```
"What appointments do I have this week?"
"Show me appointments for next 3 days"
```

### 6. create_reminder
Creates a new reminder.
```
"Remind me to call John tomorrow at 3pm"
"Create a high priority reminder to pay invoice"
```

### 7. get_sales_summary
Gets sales statistics for a period.
```
"What are my sales this month?"
"Show me today's sales"
```

## Setup

1. **Groq API Key**: Must be stored in `api_config` table
```sql
INSERT INTO api_config (service_name, api_key, user_id)
VALUES ('groq', 'YOUR_GROQ_API_KEY', auth.uid());
```

2. **Database Tables**: Requires these tables to exist:
   - cashbook
   - invoices
   - inventory
   - appointments
   - reminders

## Technical Details

**Files Created:**
- `src/lib/ai-agent-tools.ts` - Tool definitions and execution functions
- `src/lib/ai-agent-chat.ts` - Groq function calling integration
- `src/pages/AIAgentPage.tsx` - Updated UI

**Flow:**
1. User message → Groq with tools
2. Groq returns tool_calls if needed
3. Execute tools → Get data from Supabase
4. Send tool results back to Groq
5. Groq formats final response

**Model:** llama-3.3-70b-versatile (supports function calling)

## Example Conversations

**Query Data:**
```
User: What's my cashbook balance?
AI: Your cashbook balance for the last 30 days is $5,420. You have $8,200 in income and $2,780 in expenses across 45 entries.

User: Show me low stock items
AI: You have 3 items below reorder level:
- Product A: 5 units (reorder at 10)
- Product B: 2 units (reorder at 15)
- Product C: 0 units (reorder at 5)
```

**Perform Actions:**
```
User: Add a sale of $500 for consulting services
AI: I've added a $500 income entry to your cashbook for consulting services. Your new balance is $5,920.

User: Remind me to follow up with client tomorrow at 2pm
AI: I've created a reminder for you: "Follow up with client" scheduled for tomorrow at 2:00 PM with medium priority.
```

## Extending Tools

To add new tools, edit `src/lib/ai-agent-tools.ts`:

1. Add tool definition to `tools` array
2. Add case in `executeTool` switch
3. Implement the function

Example:
```typescript
{
  type: 'function',
  function: {
    name: 'get_customers',
    description: 'Get list of customers',
    parameters: { /* ... */ },
  },
}
```

## Limitations

- Groq free tier: 14,400 requests/day
- Function calling adds 1-2 extra API calls per query
- Only reads/writes data user has access to (RLS enforced)
- Cannot perform complex multi-step workflows (yet)
