import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, ExternalLink, Copy, Pencil, Globe, Plus, Check } from 'lucide-react';

type WebsiteRow = {
  id: string;
  name: string;
  subdomain: string;
  slug: string;
  status: string;
  template_id: string;
  created_at: string;
};

export default function MyWebsitesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<WebsiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_websites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setWebsites(data || []); setLoading(false); });
  }, [user]);

  const liveUrl = (w: WebsiteRow) => `https://bizsuiteai.vercel.app/preview/${w.id}`;

  const copyLink = (w: WebsiteRow) => {
    navigator.clipboard.writeText(liveUrl(w));
    setCopied(w.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareLink = (w: WebsiteRow) => {
    if (navigator.share) {
      navigator.share({ title: w.name, url: liveUrl(w) });
    } else {
      copyLink(w);
    }
  };

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Websites</h1>
            <p className="text-muted-foreground mt-1">All your landing pages in one place</p>
          </div>
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Website
          </button>
        </div>

        {websites.length === 0 ? (
          <div className="bg-card border rounded-lg p-12 text-center space-y-4">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">You haven't created any websites yet.</p>
            <button
              onClick={() => navigate('/templates')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
            >
              Browse Templates
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {websites.map(w => (
              <div key={w.id} className="bg-card border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{w.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{liveUrl(w)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Edit */}
                  <button
                    onClick={() => navigate('/website-builder/edit', { state: { websiteId: w.id, templateId: w.template_id } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-accent"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>

                  {/* Preview */}
                  <button
                    onClick={() => window.open(liveUrl(w), '_blank')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-accent"
                    title="Preview"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Preview
                  </button>

                  {/* Copy link */}
                  <button
                    onClick={() => copyLink(w)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-accent"
                    title="Copy link"
                  >
                    {copied === w.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === w.id ? 'Copied!' : 'Copy Link'}
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => shareLink(w)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    title="Share"
                  >
                    <Globe className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
