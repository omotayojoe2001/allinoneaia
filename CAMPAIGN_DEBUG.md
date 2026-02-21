# Campaign Not Showing - Debugging Guide

## The Issue
AI Agent says campaign was created (ID: c1da72b6-ebe1-45b0-8d65-4c0004b71607), but it doesn't appear in the Campaigns tab.

## Most Likely Causes

### 1. User ID Mismatch (MOST LIKELY)
**Problem:** AI Agent might be using a different user_id than your current logged-in user.

**Check in Supabase:**
```sql
-- See ALL campaigns regardless of user
SELECT id, user_id, list_id, message_body, send_via_whatsapp, created_at 
FROM scheduled_messages 
WHERE id = 'c1da72b6-ebe1-45b0-8d65-4c0004b71607';

-- See what user_id the AI is using
SELECT user_id FROM scheduled_messages 
WHERE id = 'c1da72b6-ebe1-45b0-8d65-4c0004b71607';

-- See what user_id YOU are logged in as
-- (Check in your browser console or AuthContext)
```

**Fix:** The AI Agent gets userId from the chat component. Check if it's passing correctly.

### 2. Campaign Was Created But Query Filters It Out
**Check in Supabase:**
```sql
-- See the exact campaign details
SELECT * FROM scheduled_messages 
WHERE id = 'c1da72b6-ebe1-45b0-8d65-4c0004b71607';

-- Check these fields specifically:
-- - send_via_whatsapp: Should be TRUE
-- - user_id: Should match your logged-in user
-- - list_id: Should match "New Testing List"
```

### 3. RLS Policy Blocking Access
**Check in Supabase:**
```sql
-- Disable RLS temporarily to test
ALTER TABLE scheduled_messages DISABLE ROW LEVEL SECURITY;

-- Then refresh your Campaigns page
-- If it shows up, RLS is the problem

-- Re-enable RLS after testing
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
```

## How to Check in Supabase (Step by Step)

1. **Go to Supabase Dashboard**
2. **Click "SQL Editor"**
3. **Run this query:**
```sql
SELECT 
  sm.id,
  sm.user_id,
  sm.message_body,
  sm.send_via_whatsapp,
  sm.send_via_email,
  sm.target_type,
  sm.status,
  sm.scheduled_time,
  sm.created_at,
  el.name as list_name
FROM scheduled_messages sm
LEFT JOIN email_lists el ON sm.list_id = el.id
WHERE sm.id IN (
  'c1da72b6-ebe1-45b0-8d65-4c0004b71607',
  '22e75c5f-6673-4b48-9e9d-ea20c0c9f392'
)
ORDER BY sm.created_at DESC;
```

4. **Check the results:**
   - Does the campaign exist? ✅ or ❌
   - What is the `user_id`? (Compare with your logged-in user)
   - Is `send_via_whatsapp` = `true`? ✅ or ❌
   - Is `list_id` correct?

## Expected Values

For the campaign to show in UI, it MUST have:
```
send_via_whatsapp = true
user_id = <your logged-in user id>
```

## Quick Fix Options

### Option A: Check User ID in AI Agent
File: `src/pages/AIAgentPage.tsx`

Make sure it's passing the correct userId to the AI agent.

### Option B: Remove user_id Filter Temporarily (FOR TESTING ONLY)
File: `src/pages/WhatsAppAutomation.tsx` line 45

Change:
```typescript
const { data } = await supabase
  .from('scheduled_messages')
  .select('*, email_lists(name)')
  .eq('user_id', user?.id)  // <-- REMOVE THIS LINE TEMPORARILY
  .eq('send_via_whatsapp', true)
  .order('created_at', { ascending: false });
```

To:
```typescript
const { data } = await supabase
  .from('scheduled_messages')
  .select('*, email_lists(name)')
  // .eq('user_id', user?.id)  // <-- COMMENTED OUT
  .eq('send_via_whatsapp', true)
  .order('created_at', { ascending: false });
```

If campaigns show up after this, the problem is user_id mismatch.

### Option C: Check AI Agent User ID
File: `src/pages/AIAgentPage.tsx`

Add console.log to see what userId the AI is using:
```typescript
const handleSendMessage = async () => {
  console.log('AI Agent User ID:', user?.id); // <-- ADD THIS
  // ... rest of code
};
```

## What to Report Back

After checking Supabase, tell me:
1. ✅ or ❌ Does the campaign exist in scheduled_messages table?
2. What is the `user_id` in the campaign row?
3. What is YOUR logged-in `user_id`? (Check browser console or AuthContext)
4. Is `send_via_whatsapp` = `true`?
5. Is `list_id` pointing to "New Testing List"?

This will tell us exactly what's wrong!
