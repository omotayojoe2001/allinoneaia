import { useState } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GrammarChecker = () => {
  const [text, setText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const { toast } = useToast();

  const checkGrammar = async () => {
    if (!text.trim()) {
      toast({ title: 'Error', description: 'Please enter text to check', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          text,
          language: 'en-US',
        }),
      });

      const data = await response.json();
      setErrors(data.matches || []);

      let corrected = text;
      data.matches.reverse().forEach((match: any) => {
        if (match.replacements.length > 0) {
          const replacement = match.replacements[0].value;
          corrected = corrected.substring(0, match.offset) + replacement + corrected.substring(match.offset + match.length);
        }
      });

      setCorrectedText(corrected);
      toast({ title: 'Grammar check complete', description: `Found ${data.matches.length} issues` });
    } catch (error: any) {
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

        {errors.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Issues Found ({errors.length})</h3>
            <div className="space-y-2">
              {errors.map((error, i) => (
                <div key={i} className="glass-card rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{error.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Context: "{error.context.text}"
                      </p>
                      {error.replacements.length > 0 && (
                        <p className="text-xs text-primary mt-1">
                          Suggestion: {error.replacements[0].value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarChecker;
