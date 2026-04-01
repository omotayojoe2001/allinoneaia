import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function WebsitePreviewPage() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [srcDoc, setSrcDoc] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!websiteId) { setNotFound(true); setLoading(false); return; }
    load();
  }, [websiteId]);

  const load = async () => {
    try {
      // Load website row
      const { data: website } = await supabase
        .from('user_websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (!website) { setNotFound(true); setLoading(false); return; }

      // Load customization (saved HTML/CSS)
      const { data: customization } = await supabase
        .from('website_customizations')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      // Fall back to template if no customization saved yet
      let html = customization?.html_modifications?.custom_html;
      let css = customization?.css_modifications?.custom_css;

      if (!html || !css) {
        const { data: template } = await supabase
          .from('templates')
          .select('html_content, css_content, js_content')
          .eq('id', website.template_id)
          .single();
        html = html || template?.html_content || '';
        css = css || template?.css_content || '';
      }

      const listId = customization?.text_replacements?.connected_list_id ?? '';

      setSrcDoc(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${website.name}</title>
  <style>${css}</style>
</head>
<body>
${html.replace(/<form[^>]*>/g, `<form action="https://bizsuiteai.vercel.app/api/form-submit" method="POST" data-list-id="${listId}" data-website-id="${websiteId}">`)}
<script>
  document.querySelectorAll('form').forEach(function(f) {
    f.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(f));
      fetch('https://bizsuiteai.vercel.app/api/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, list_id: f.dataset.listId, website_id: f.dataset.websiteId })
      }).then(function() {
        f.innerHTML = '<p style="text-align:center;padding:2rem;font-size:1.1rem;">✅ Thank you! We will be in touch soon.</p>';
      }).catch(function() {
        alert('Submitted! Thank you.');
      });
    });
  });
<\/script>
</body>
</html>`);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="w-full h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (notFound) return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-2xl font-bold">Page not found</p>
      <p className="text-muted-foreground">This website doesn't exist or has been removed.</p>
    </div>
  );

  return (
    <iframe
      srcDoc={srcDoc}
      className="w-full h-screen border-0"
      title="Website Preview"
      sandbox="allow-forms allow-scripts allow-same-origin"
    />
  );
}
