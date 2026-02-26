# Quick Implementation Guide for Page AI Agents

## Already Implemented ✅

The following pages already have AI agents integrated:
- ✅ Dashboard
- ✅ Business Tools
- ✅ Reminders
- ✅ Automation

## To Implement (Copy-Paste Ready)

### For Tasks Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement (first line after opening div)
<PageAIAgent {...pageAgentConfigs.tasks} />
```

### For Appointments Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.appointments} />
```

### For Customers Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.customers} />
```

### For Stock Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.stock} />
```

### For Content Studio Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.content} />
```

### For Social Media Manager Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.social} />
```

### For Chatbot Builder Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.chatbot} />
```

### For Growth Services Page
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.growth} />
```

### For Cashbook Page (Business sub-page)
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.cashbook} />
```

### For Invoices Page (Business sub-page)
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.invoices} />
```

### For Staff Page (Business sub-page)
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.staff} />
```

### For Reports Page (Business sub-page)
```tsx
// Add to imports
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

// Add inside return statement
<PageAIAgent {...pageAgentConfigs.reports} />
```

## Complete Example

Here's a complete example of a page with AI agent:

```tsx
import { useState, useEffect } from 'react';
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const MyPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    // Your data loading logic
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      {/* AI Agent - Add this line */}
      <PageAIAgent {...pageAgentConfigs.tasks} />
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Page</h1>
        {/* Your page content */}
      </div>
    </div>
  );
};

export default MyPage;
```

## Testing the AI Agent

After adding the AI agent to a page:

1. Navigate to the page
2. Look for the floating purple/blue button in the bottom-right corner
3. Click it to open the chat interface
4. Try these test commands:
   - "What can you help me with?"
   - "Show me [relevant data for the page]"
   - "Create a new [item]"
   - Use the microphone button for voice input

## Troubleshooting

### AI Agent Not Showing
- Check if imports are correct
- Verify the page key exists in `pageAgentConfigs`
- Ensure user is authenticated
- Check browser console for errors

### Voice Input Not Working
- Grant microphone permissions
- Use Chrome/Edge for best support
- Ensure HTTPS or localhost

### Tool Execution Failing
- Verify `VITE_GROQ_API_KEY` in `.env`
- Check network tab for API errors
- Review tool implementation in `ai-agent-tools.ts`

## Next Steps

1. Add AI agents to all remaining pages using the templates above
2. Test each implementation
3. Customize the `availableActions` in `page-agent-configs.ts` if needed
4. Add more tools to `ai-agent-tools.ts` for additional functionality

## File Locations

- Component: `src/components/PageAIAgent.tsx`
- Configurations: `src/lib/page-agent-configs.ts`
- Tools: `src/lib/ai-agent-tools.ts`
- Hook: `src/hooks/use-page-ai-agent.tsx`
- Documentation: `PAGE_AI_AGENTS_GUIDE.md`
