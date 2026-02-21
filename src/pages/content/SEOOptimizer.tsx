import { useState, useEffect } from 'react';
import { TrendingUp, ArrowLeft, Sparkles, RefreshCw, AlertCircle, CheckCircle, Copy, Hash, FileText, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface SEOAnalysis {
  score: number;
  issues: string[];
  improvements: string[];
}

interface SavedContent {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

const SEOOptimizer = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'analyze' | 'generate'>('analyze');
  const [input, setInput] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [savedContents, setSavedContents] = useState<SavedContent[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<SEOAnalysis | null>(null);
  const [optimizedAnalysis, setOptimizedAnalysis] = useState<SEOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedContents();
  }, []);

  const loadSavedContents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('ai_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'seo')
      .order('updated_at', { ascending: false });

    if (data) setSavedContents(data);
  };

  const loadContent = (item: SavedContent) => {
    setCurrentId(item.id);
    setContent(item.content);
    const analysis = calculateSEOScore(item.content);
    setOptimizedAnalysis(analysis);
    setOriginalAnalysis(null);
  };

  const saveContent = async () => {
    if (!content.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const title = content.split('\n')[0].replace(/^#+\s*/, '').substring(0, 50) || 'SEO Content';

    if (currentId) {
      await supabase.from('ai_documents').update({
        title,
        content,
        word_count: content.split(/\s+/).length,
        updated_at: new Date().toISOString(),
      }).eq('id', currentId);
    } else {
      const { data } = await supabase.from('ai_documents').insert({
        user_id: user.id,
        title,
        content,
        type: 'seo',
        word_count: content.split(/\s+/).length,
      }).select().single();
      if (data) setCurrentId(data.id);
    }
    loadSavedContents();
    toast({ title: 'Content saved' });
  };

  const deleteContent = async (id: string) => {
    await supabase.from('ai_documents').delete().eq('id', id);
    if (currentId === id) {
      setCurrentId(null);
      setContent('');
      setHashtags('');
    }
    loadSavedContents();
  };

  const copyContent = () => {
    const fullContent = hashtags ? `${content}\n\n${hashtags}` : content;
    navigator.clipboard.writeText(fullContent);
    toast({ title: 'Copied to clipboard' });
  };

  const generateHashtags = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const { data: config } = await supabase.from('api_config').select('api_key').eq('service', 'groq').single();
      if (!config?.api_key) throw new Error('API key not found');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.api_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Generate 10-15 relevant hashtags for this content. Return only hashtags separated by spaces:\n\n${content.substring(0, 500)}`
          }],
        }),
      });

      const data = await response.json();
      const tags = data.choices?.[0]?.message?.content || '';
      setHashtags(tags);
      toast({ title: 'Hashtags generated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateSEOScore = (text: string): SEOAnalysis => {
    let score = 0;
    const issues: string[] = [];
    const wordCount = text.split(/\s+/).filter(w => w).length;
    
    if (wordCount < 300) {
      issues.push(`Content too short (${wordCount} words). Aim for 300+ words.`);
      score += (wordCount / 300) * 25;
    } else {
      score += 25;
    }
    
    const hasH1 = /^#\s/m.test(text) || /<h1>/i.test(text) || /^[A-Z][^\n]{10,}$/m.test(text);
    const hasH2 = /^##\s/m.test(text) || /<h2>/i.test(text);
    
    if (!hasH1) issues.push('Missing main heading (H1). Add a clear title.');
    else score += 15;
    
    if (!hasH2) issues.push('No subheadings (H2). Break content into sections.');
    else score += 15;
    
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length < 3) {
      issues.push('Poor paragraph structure. Break into smaller paragraphs.');
      score += 10;
    } else {
      score += 20;
    }
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const avgSentenceLength = wordCount / sentences.length;
    if (avgSentenceLength > 25) {
      issues.push('Sentences too long. Keep under 25 words for readability.');
      score += 10;
    } else {
      score += 20;
    }
    
    const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
    if (avgWordLength > 6) {
      issues.push('Complex words detected. Use simpler language.');
      score += 10;
    } else {
      score += 20;
    }
    
    return { score: Math.min(Math.round(score), 100), issues, improvements: [] };
  };

  const analyzeSEO = async () => {
    if (!input.trim()) {
      toast({ title: 'Error', description: 'Please enter content to analyze', variant: 'destructive' });
      return;
    }

    const analysis = calculateSEOScore(input);
    setOriginalAnalysis(analysis);
    setOptimizedAnalysis(null);
    setContent('');
  };

  const rewriteForSEO = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const { data: config } = await supabase.from('api_config').select('api_key').eq('service', 'groq').single();
      if (!config?.api_key) throw new Error('API key not found');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.api_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'system',
            content: 'You are an SEO expert. Rewrite content to be highly SEO-optimized. Use proper markdown with # for H1, ## for H2. Add blank lines between paragraphs. Keep natural spacing and formatting.'
          }, {
            role: 'user',
            content: `Rewrite this for maximum SEO. Add proper headings, break into clear paragraphs with spacing:\n\n${input}`
          }],
        }),
      });

      const data = await response.json();
      const optimized = data.choices?.[0]?.message?.content || '';
      setContent(optimized);
      
      const analysis = calculateSEOScore(optimized);
      analysis.improvements = [
        'Added clear H1 and H2 headings for structure',
        'Broke content into readable paragraphs',
        'Improved sentence flow and readability',
        'Optimized keyword placement naturally',
        'Added proper spacing between sections'
      ];
      setOptimizedAnalysis(analysis);
      toast({ title: 'Content optimized for SEO' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSEO = async () => {
    if (!input.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic or keywords', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: config } = await supabase.from('api_config').select('api_key').eq('service', 'groq').single();
      if (!config?.api_key) throw new Error('API key not found');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.api_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'system',
            content: 'You are an SEO content writer. Create highly optimized content with # for H1, ## for H2. Add blank lines between paragraphs. Aim for 300+ words with natural spacing.'
          }, {
            role: 'user',
            content: `Write SEO-optimized content about: ${input}`
          }],
        }),
      });

      const data = await response.json();
      const generated = data.choices?.[0]?.message?.content || '';
      setContent(generated);
      
      const analysis = calculateSEOScore(generated);
      analysis.issues = [];
      analysis.improvements = [
        'Content generated with optimal SEO structure',
        'Proper H1 and H2 headings included',
        'Natural keyword placement throughout',
        'Readable paragraph structure with spacing',
        'Optimized for search engine ranking'
      ];
      setOptimizedAnalysis(analysis);
      setOriginalAnalysis(null);
      toast({ title: 'SEO content generated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderAnalysis = (analysis: SEOAnalysis | null, title: string) => {
    if (!analysis) return null;
    
    return (
      <div className="mb-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}/100</span>
        </div>
        
        {analysis.issues.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-red-500 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Issues Found:
            </p>
            <ul className="text-sm space-y-1">
              {analysis.issues.map((issue, i) => (
                <li key={i} className="text-muted-foreground">• {issue}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.improvements.length > 0 && (
          <div>
            <p className="text-sm font-medium text-green-500 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Improvements Made:
            </p>
            <ul className="text-sm space-y-1">
              {analysis.improvements.map((imp, i) => (
                <li key={i} className="text-muted-foreground">• {imp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* History Sidebar */}
      <div className="w-64 border-r bg-background/50 flex flex-col">
        <div className="p-4 border-b">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="font-semibold mb-2">Saved Content</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {savedContents.map(item => (
            <div key={item.id} className={`p-3 rounded-lg mb-2 hover:bg-accent cursor-pointer ${currentId === item.id ? 'bg-accent' : ''}`}>
              <div className="flex items-start justify-between" onClick={() => loadContent(item)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.updated_at).toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteContent(item.id); }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> SEO Optimizer
          </h1>

          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => {
                setMode('analyze');
                setInput('');
                setContent('');
                setHashtags('');
                setOriginalAnalysis(null);
                setOptimizedAnalysis(null);
              }} 
              className={`px-4 py-2 rounded-lg ${mode === 'analyze' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
              Analyze & Improve
            </button>
            <button 
              onClick={() => {
                setMode('generate');
                setInput('');
                setContent('');
                setHashtags('');
                setOriginalAnalysis(null);
                setOptimizedAnalysis(null);
              }} 
              className={`px-4 py-2 rounded-lg ${mode === 'generate' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
              Generate from Scratch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Analysis */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {mode === 'analyze' ? 'Your Content' : 'Topic / Keywords'}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'analyze' ? 'Paste your content here...' : 'Enter topic or keywords...'}
                className="w-full h-64 p-4 border rounded-lg bg-background resize-none mb-4"
              />
              <div className="flex gap-2 mb-4">
                {mode === 'analyze' ? (
                  <>
                    <button onClick={analyzeSEO} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
                      Analyze SEO
                    </button>
                    <button onClick={rewriteForSEO} disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> {loading ? 'Rewriting...' : 'Rewrite for SEO'}
                    </button>
                  </>
                ) : (
                  <button onClick={generateSEO} disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate SEO Content'}
                  </button>
                )}
              </div>

              {originalAnalysis && renderAnalysis(originalAnalysis, 'Your Content Analysis')}
              {optimizedAnalysis && renderAnalysis(optimizedAnalysis, 'Optimized Content Analysis')}
            </div>

            {/* Right: Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Generated Content</label>
                {content && (
                  <div className="flex gap-2">
                    <button onClick={copyContent} className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button onClick={generateHashtags} disabled={loading} className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50">
                      <Hash className="w-3 h-3" /> Hashtags
                    </button>
                    <button onClick={saveContent} className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded flex items-center gap-1">
                      <Save className="w-3 h-3" /> Save
                    </button>
                  </div>
                )}
              </div>
              <div className="h-96 p-4 border rounded-lg bg-background overflow-y-auto">
                {content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-6 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-2 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>ul]:ml-6 [&>li]:mb-2 [&>strong]:font-bold [&>em]:italic">
                    <ReactMarkdown>{content}</ReactMarkdown>
                    {hashtags && (
                      <div className="mt-6 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Hashtags:</p>
                        <p className="text-sm">{hashtags}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Generated content will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOOptimizer;
