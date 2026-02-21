import { useState } from 'react';
import { CheckCircle2, Copy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const GrammarChecker = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkGrammar = async () => {
    if (!text.trim()) {
      toast({ title: 'Error', description: 'Please enter text to check', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: config, error: configError } = await supabase
        .from('api_config')
        .select('api_key')
        .eq('service', 'groq')
        .single();

      if (configError || !config?.api_key) {
        throw new Error('Groq API key not found. Please add it in database.');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a professional grammar checker. Fix all grammar, spelling, punctuation, and style issues. Preserve the original formatting, paragraph breaks, and spacing. Return ONLY the corrected text with proper spacing between paragraphs.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Groq API error');
      }

      const data = await response.json();
      const corrected = data.choices?.[0]?.message?.content || '';
      
      if (!corrected) {
        throw new Error('No response from AI');
      }
      
      setCorrectedText(corrected);
      toast({ title: 'Grammar check complete' });
    } catch (error: any) {
      console.error('Grammar check error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(correctedText);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">Grammar Checker</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Original Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full h-96 p-4 border rounded-lg bg-background resize-none"
            />
            <button
              onClick={checkGrammar}
              disabled={loading}
              className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Grammar'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Corrected Text</label>
            <textarea
              value={correctedText}
              readOnly
              placeholder="Corrected text will appear here..."
              className="w-full h-96 p-4 border rounded-lg bg-background resize-none"
            />
            {correctedText && (
              <button
                onClick={copyText}
                className="mt-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarChecker;
