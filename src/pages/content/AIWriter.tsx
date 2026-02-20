import { useState } from 'react';
import { FileText, Save, Copy, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiProvider } from '@/lib/ai-provider';
import { supabase } from '@/lib/supabase';

const AIWriter = () => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Error', description: 'Please enter a prompt', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const fullPrompt = `Write a detailed, well-structured article about: ${prompt}\n\nArticle:`;
      const generated = await aiProvider.generateText(fullPrompt, { maxTokens: 2000 });
      setContent(generated);
      toast({ title: 'Content generated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const continueWriting = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const fullPrompt = `Continue this article:\n\n${content}\n\nContinuation:`;
      const generated = await aiProvider.generateText(fullPrompt, { maxTokens: 1000 });
      setContent(content + '\n\n' + generated);
      toast({ title: 'Content continued' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!content.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from('ai_documents').insert({
        user_id: user.id,
        title: title || 'Untitled Document',
        content,
        type: 'writer',
        word_count: content.split(/\s+/).length,
      });

      if (error) throw error;
      toast({ title: 'Document saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6" /> AI Writer
        </h1>

        <div className="glass-card rounded-lg p-6 mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title..."
            className="w-full p-3 border rounded-lg bg-background mb-4"
          />

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to write about? (e.g., 'A blog post about AI in healthcare')"
            className="w-full p-3 border rounded-lg bg-background mb-4 h-24 resize-none"
          />

          <button
            onClick={generateContent}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generating...' : 'Generate Content'}
          </button>
        </div>

        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium">Generated Content</label>
            <div className="flex gap-2">
              <button
                onClick={continueWriting}
                disabled={loading || !content}
                className="text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Continue Writing
              </button>
              <button
                onClick={copyContent}
                disabled={!content}
                className="text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button
                onClick={saveDocument}
                disabled={!content}
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Generated content will appear here..."
            className="w-full h-96 p-4 border rounded-lg bg-background resize-none"
          />

          {content && (
            <div className="mt-4 text-sm text-muted-foreground">
              Word count: {content.split(/\s+/).filter(w => w).length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIWriter;
