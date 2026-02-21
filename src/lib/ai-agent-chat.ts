import { tools, executeTool } from './ai-agent-tools';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithAgent(
  userMessage: string,
  chatHistory: Message[],
  userId: string,
  groqApiKey: string
): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: `You are an intelligent business assistant with access to the user's business data. You can:
- Query cashbook, invoices, stock, appointments, and sales data
- Add entries to the cashbook
- Create reminders
- Provide insights and summaries

When users ask about their data or want to perform actions, use the available tools. Be conversational and helpful.`,
    },
    ...chatHistory,
    { role: 'user', content: userMessage },
  ];

  // First API call - let Groq decide if it needs to call tools
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Groq API error:', errorData);
    throw new Error(`Groq API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message;

  // Check if AI wants to call tools
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    const toolResults = [];

    // Execute all tool calls
    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      
      console.log(`[AI Agent] Calling tool: ${toolName}`, toolArgs);
      const result = await executeTool(toolName, toolArgs, userId);
      console.log(`[AI Agent] Tool result:`, result);
      
      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(result),
      });
    }

    // Second API call - send tool results back to Groq
    const finalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...messages,
          assistantMessage,
          ...toolResults,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!finalResponse.ok) {
      throw new Error(`Groq API error: ${finalResponse.statusText}`);
    }

    const finalData = await finalResponse.json();
    return finalData.choices[0].message.content;
  }

  // No tool calls needed, return direct response
  return assistantMessage.content;
}
