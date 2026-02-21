import { useState, useEffect, useRef } from 'react';
import { Presentation, Send, ArrowLeft, Plus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const PresentationAI = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'presentation')
      .order('updated_at', { ascending: false });

    if (data) setConversations(data);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const createNewConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, type: 'presentation', title: 'New Presentation' })
      .select()
      .single();

    if (data) {
      setCurrentConversation(data.id);
      setMessages([]);
      loadConversations();
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    let convId = currentConversation;
    if (!convId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, type: 'presentation', title: input.substring(0, 50) })
        .select()
        .single();

      if (data) {
        convId = data.id;
        setCurrentConversation(convId);
        loadConversations();
      }
    }

    const userMessage = { role: 'user' as const, content: input };
    await supabase.from('ai_messages').insert({ conversation_id: convId, ...userMessage });
    
    setMessages(prev => [...prev, { ...userMessage, id: Date.now().toString(), created_at: new Date().toISOString() }]);
    setInput('');
    setLoading(true);

    try {
      const { data: config } = await supabase.from('api_config').select('api_key').eq('service', 'groq').single();
      if (!config?.api_key) throw new Error('API key not found');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.api_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a professional presentation designer. Help users create compelling presentation content with clear structure, engaging slides, and impactful messaging. Provide slide-by-slide content with titles and bullet points.' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ],
        }),
      });

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || 'No response';
      
      const aiMessage = { role: 'assistant' as const, content: aiContent };
      await supabase.from('ai_messages').insert({ conversation_id: convId, ...aiMessage });
      setMessages(prev => [...prev, { ...aiMessage, id: Date.now().toString(), created_at: new Date().toISOString() }]);

      await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background/50 flex flex-col">
        <div className="p-4 border-b">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={createNewConversation} className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> New Presentation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg mb-2 hover:bg-accent transition-colors ${currentConversation === conv.id ? 'bg-accent' : ''}`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(conv.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Presentation className="w-5 h-5" /> Presentation AI
          </h1>
          <p className="text-sm text-muted-foreground">What would you like to present today?</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Presentation className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Start a new presentation</h3>
                <p className="text-sm text-muted-foreground">Tell me what you want to present and I'll help you create compelling slides.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2 [&>h2]:mt-4 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-2 [&>p]:mb-3 [&>p]:leading-relaxed [&>ul]:mb-3 [&>ul]:ml-4 [&>li]:mb-1 [&>strong]:font-bold [&>em]:italic">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-3 border rounded-lg bg-background"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationAI;
