import { useState, useRef, useEffect } from 'react';
import { Bot, X, Mic, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { executeTool } from '@/lib/ai-agent-tools';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PageAIAgentProps {
  pageContext: string;
  pageName: string;
  availableActions: string[];
  position?: 'bottom-right' | 'top-right';
}

export const PageAIAgent = ({ 
  pageContext, 
  pageName, 
  availableActions,
  position = 'bottom-right' 
}: PageAIAgentProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const processMessage = async (userMessage: string) => {
    if (!user) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: config } = await supabase
        .from('api_config')
        .select('api_key')
        .eq('service', 'groq')
        .single();

      const apiKey = config?.api_key;
      if (!apiKey) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Groq API key not found. Please configure it in Settings.', 
          timestamp: new Date() 
        }]);
        setIsLoading(false);
        return;
      }

      const { tools } = await import('@/lib/ai-agent-tools');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant for the ${pageName} page. Context: ${pageContext}. Available actions: ${availableActions.join(', ')}. You can execute actions using the available tools. Always use tools to fetch real data - never make up examples or fake data.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          tools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      if (assistantMessage.tool_calls) {
        let results = [];
        for (const toolCall of assistantMessage.tool_calls) {
          const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
          const result = await executeTool(
            toolCall.function.name,
            args,
            user.id
          );
          results.push(result);
        }
        
        // Send results back to AI for natural response
        const followUp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `Present this data to the user in a clear, natural way: ${JSON.stringify(results)}`
              },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });
        
        const followUpData = await followUp.json();
        const finalResponse = followUpData.choices[0].message.content;
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: finalResponse, 
          timestamp: new Date() 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: assistantMessage.content, 
          timestamp: new Date() 
        }]);
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    processMessage(input);
    setInput('');
  };

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'top-20 right-6';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses} z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group`}
      >
        <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className={`fixed ${positionClasses} z-50 ${isMinimized ? 'w-80' : 'w-96'} transition-all duration-300`}>
      <div className="glass-card rounded-lg shadow-2xl overflow-hidden border border-border/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-white font-semibold text-sm">{pageName} Assistant</h3>
              <p className="text-white/80 text-xs">AI-powered help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-background/50">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Hi! I'm your {pageName} assistant.</p>
                  <p className="mt-2">Ask me to help with:</p>
                  <ul className="mt-2 text-xs space-y-1">
                    {availableActions.slice(0, 3).map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-background/80">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-500 text-white' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type or speak your request..."
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
