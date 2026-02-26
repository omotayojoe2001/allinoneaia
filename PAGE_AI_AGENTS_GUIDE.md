# Page-Specific AI Agents System

## Overview

Every page in the application now has its own contextual AI agent that helps users perform tasks without manual navigation. Users can interact with the AI agent using voice or text input.

## Features

- **Page-Specific Context**: Each AI agent understands the context of its page
- **Voice Input**: Users can speak their requests using the microphone button
- **Text Input**: Traditional text-based interaction
- **Function Calling**: AI agents can execute actions directly (create invoices, add tasks, etc.)
- **Minimizable Interface**: Agents can be minimized to save screen space
- **Persistent Chat**: Conversation history is maintained during the session

## Available Pages with AI Agents

1. **Dashboard** - Business overview and statistics
2. **Tasks** - Task management
3. **Appointments** - Appointment scheduling
4. **Customers** - Customer database management
5. **Stock** - Inventory management
6. **Automation** - Email/WhatsApp campaigns
7. **Chatbot Builder** - WhatsApp chatbot creation
8. **Content Studio** - Content generation
9. **Growth Services** - Social media growth
10. **Social Media Manager** - Social media management
11. **Business Tools** - Financial management
12. **Reminders** - Reminder management
13. **Cashbook** - Income/expense tracking
14. **Invoices** - Invoice management
15. **Staff** - Employee management
16. **Reports** - Business analytics

## How to Add AI Agent to a New Page

### Method 1: Using the Hook (Recommended)

```tsx
import { usePageAIAgent } from '@/hooks/use-page-ai-agent';

const MyPage = () => {
  const aiAgent = usePageAIAgent('dashboard'); // or any other page key
  
  return (
    <div>
      {aiAgent}
      {/* Your page content */}
    </div>
  );
};
```

### Method 2: Direct Component Usage

```tsx
import { PageAIAgent } from '@/components/PageAIAgent';
import { pageAgentConfigs } from '@/lib/page-agent-configs';

const MyPage = () => {
  return (
    <div>
      <PageAIAgent {...pageAgentConfigs.dashboard} />
      {/* Your page content */}
    </div>
  );
};
```

### Method 3: Custom Configuration

```tsx
import { PageAIAgent } from '@/components/PageAIAgent';

const MyPage = () => {
  return (
    <div>
      <PageAIAgent
        pageName="My Custom Page"
        pageContext="Description of what this page does"
        availableActions={[
          'Action 1',
          'Action 2',
          'Action 3'
        ]}
        position="top-right"
      />
      {/* Your page content */}
    </div>
  );
};
```

## Adding New Page Configuration

To add a new page configuration, edit `src/lib/page-agent-configs.ts`:

```typescript
export const pageAgentConfigs = {
  // ... existing configs
  
  myNewPage: {
    pageName: 'My New Page',
    pageContext: 'Detailed description of what this page does and its purpose',
    availableActions: [
      'Action users can perform',
      'Another action',
      'Yet another action'
    ]
  }
};
```

## Example User Interactions

### Dashboard
- "Show me today's revenue"
- "How many overdue reminders do I have?"
- "What's my net balance this month?"

### Tasks
- "Create a task to follow up with John tomorrow"
- "Show me all high priority tasks"
- "Mark the meeting preparation task as complete"

### Customers
- "Add a new customer named Sarah Johnson"
- "Show me invoices for ABC Company"
- "Who are my top 5 customers?"

### Stock
- "Add 50 units of Product X to inventory"
- "Which items need reordering?"
- "What's my total inventory value?"

### Invoices
- "Create an invoice for John Doe with 3 items"
- "Show me all overdue invoices"
- "Mark invoice INV-12345 as paid"

### Automation
- "Create an email campaign for my VIP list"
- "Generate a promotional WhatsApp message about our sale"
- "Schedule a campaign for tomorrow at 10 AM"

## AI Agent Capabilities

The AI agents can:

1. **Query Data**
   - Get summaries and statistics
   - Search and filter records
   - View detailed information

2. **Create Records**
   - Add new customers, tasks, appointments
   - Create invoices and stock items
   - Generate reminders

3. **Update Records**
   - Mark tasks/invoices as complete/paid
   - Update customer information
   - Modify stock quantities

4. **Generate Content**
   - Create SEO-optimized marketing content
   - Generate email/WhatsApp messages
   - Produce reports and summaries

5. **Analyze Data**
   - Calculate profit margins
   - Compare revenue periods
   - Identify trends

## Technical Details

### Components

- **PageAIAgent** (`src/components/PageAIAgent.tsx`)
  - Main AI agent component
  - Handles voice/text input
  - Manages conversation state
  - Executes tool calls

### Configuration

- **page-agent-configs.ts** (`src/lib/page-agent-configs.ts`)
  - Defines page-specific contexts
  - Lists available actions per page

### Tools

- **ai-agent-tools.ts** (`src/lib/ai-agent-tools.ts`)
  - Function definitions for AI
  - Tool execution logic
  - Database operations

### Hook

- **use-page-ai-agent.tsx** (`src/hooks/use-page-ai-agent.tsx`)
  - Simplifies AI agent integration
  - Provides consistent interface

## Customization

### Position

Change the AI agent button position:

```tsx
<PageAIAgent {...config} position="top-right" />
// or
<PageAIAgent {...config} position="bottom-right" />
```

### Styling

The AI agent uses Tailwind CSS and respects your theme. Customize in `PageAIAgent.tsx`:

- Button colors: `bg-gradient-to-r from-purple-600 to-blue-600`
- Chat bubble colors: `bg-primary` and `bg-secondary`
- Border styles: `border-border/50`

## Voice Recognition

Voice input requires:
- Modern browser with Web Speech API support
- Microphone permissions
- HTTPS connection (or localhost)

Supported browsers:
- Chrome/Edge (best support)
- Safari (limited)
- Firefox (experimental)

## Environment Variables

Required in `.env`:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

## Best Practices

1. **Clear Instructions**: Tell users what the AI can do
2. **Contextual Help**: Provide examples specific to each page
3. **Error Handling**: Gracefully handle API failures
4. **Loading States**: Show when AI is processing
5. **Conversation History**: Maintain context within session

## Troubleshooting

### AI Agent Not Appearing
- Check if component is imported correctly
- Verify page key exists in `pageAgentConfigs`
- Ensure user is authenticated

### Voice Input Not Working
- Check browser compatibility
- Verify microphone permissions
- Ensure HTTPS connection

### Tool Execution Failing
- Verify Groq API key is set
- Check user authentication
- Review tool function implementation

## Future Enhancements

- [ ] Persistent conversation history across sessions
- [ ] Multi-language support
- [ ] Custom voice selection
- [ ] Keyboard shortcuts
- [ ] Agent personality customization
- [ ] Learning from user interactions
- [ ] Suggested actions based on page context
- [ ] Integration with notification system

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Test with simple commands first
4. Check browser console for errors
