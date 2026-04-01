import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { templateService, userWebsiteService, websiteCustomizationService } from '@/lib/website-builder-service';
import { Template, UserWebsite } from '@/lib/website-builder-types';
import { Loader2, Save, Eye, MessageSquare, Trash2, Plus, Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SectionType = 'text' | 'placeholder' | 'button' | 'select';

type Section = {
  key: string;
  label: string;
  selector: string;
  type: SectionType;
};

const SECTIONS: Section[] = [
  { key: 'heading', label: 'Heading Text', selector: 'h1', type: 'text' },
  { key: 'subheading', label: 'Subheading Text', selector: 'h2,h3,p', type: 'text' },
  { key: 'cta', label: 'CTA Button Text', selector: 'button,input[type="submit"],a.btn,a[class*="button"],a[class*="btn"]', type: 'button' },
  { key: 'name_placeholder', label: 'Name Field', selector: 'input[placeholder*="name" i],input[name*="name" i]', type: 'placeholder' },
  { key: 'email_placeholder', label: 'Email Field', selector: 'input[type="email"]', type: 'placeholder' },
  { key: 'phone_placeholder', label: 'Phone Field', selector: 'input[type="tel"],input[placeholder*="phone" i]', type: 'placeholder' },
  { key: 'select_field', label: 'Dropdown / Select', selector: 'select', type: 'select' },
  { key: 'footer_note', label: 'Footer Note', selector: 'footer,p[class*="note" i],p[class*="disclaimer" i],small', type: 'text' },
  { key: 'theme_color', label: 'Theme Color', selector: '', type: 'text' },
  { key: 'heading_color', label: 'Heading Color', selector: '', type: 'text' },
  { key: 'subheading_color', label: 'Subheading Color', selector: '', type: 'text' },
  { key: 'button_bg_color', label: 'Button Background Color', selector: '', type: 'text' },
  { key: 'button_text_color', label: 'Button Text Color', selector: '', type: 'text' },
];

function parseHtmlElement(html: string, selector: string): Element | null {
  if (!selector) return null;
  const doc = new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');
  for (const sel of selector.split(',').map(s => s.trim())) {
    try {
      const el = doc.querySelector(sel);
      if (el) return el;
    } catch {}
  }
  return null;
}

function getSelectOptions(html: string): string[] {
  const el = parseHtmlElement(html, 'select');
  if (!el) return [];
  return Array.from(el.querySelectorAll('option'))
    .map(o => o.textContent?.trim() || '')
    .filter(Boolean);
}

function applySelectOptions(html: string, options: string[]): string {
  const optionsHtml = options
    .map(o => `<option value="${o.toLowerCase().replace(/\s+/g, '-')}">${o}</option>`)
    .join('');
  // replace everything between <select...> and </select>
  return html.replace(/(<select[^>]*>)([\s\S]*?)(<\/select>)/i, `$1${optionsHtml}$3`);
}

function getCurrentValue(html: string, section: Section): string {
  if (['theme_color', 'heading_color', 'subheading_color', 'button_bg_color', 'button_text_color'].includes(section.key)) return '(see preview)';
  if (section.type === 'select') return getSelectOptions(html).join(', ');
  const el = parseHtmlElement(html, section.selector);
  if (!el) return '';
  if (section.type === 'placeholder') return (el as HTMLInputElement).placeholder || '';
  if (section.type === 'button') return (el as HTMLInputElement).value?.trim() || el.textContent?.trim() || '';
  return el.textContent?.trim() || '';
}

// Resolve a color name or hex/rgb value to a CSS color string
function resolveColor(input: string): string {
  const named: Record<string, string> = {
    red: '#ef4444', crimson: '#dc2626', rose: '#f43f5e', pink: '#ec4899', hotpink: '#db2777',
    orange: '#f97316', amber: '#f59e0b', yellow: '#eab308', lime: '#84cc16',
    green: '#10b981', emerald: '#059669', teal: '#14b8a6', cyan: '#06b6d4',
    sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6',
    purple: '#a855f7', fuchsia: '#d946ef', slate: '#64748b', gray: '#6b7280',
    zinc: '#71717a', neutral: '#737373', stone: '#78716c', white: '#ffffff',
    black: '#000000', navy: '#1e3a5f', brown: '#92400e', gold: '#d97706',
    silver: '#9ca3af', coral: '#f87171', salmon: '#fca5a5', lavender: '#c4b5fd',
    mint: '#6ee7b7', peach: '#fdba74', maroon: '#7f1d1d', olive: '#4d7c0f',
    magenta: '#e879f9', turquoise: '#2dd4bf', beige: '#fef3c7', cream: '#fffbeb',
  };
  const lower = input.toLowerCase().trim();
  return named[lower] || input.trim();
}

function applyTextChange(html: string, css: string, section: Section, newValue: string): { html: string; css: string } {
  const color = resolveColor(newValue);

  if (section.key === 'theme_color') {
    // Replace known template gradient colors, then inject a universal override
    const replaced = css.replace(/#667eea/gi, color).replace(/#764ba2/gi, color);
    const injection = `\n.hero, header, section { background: ${color} !important; background-color: ${color} !important; }`;
    return { html, css: replaced + injection };
  }

  if (section.key === 'heading_color') {
    return { html, css: css + `\nh1, h1 * { color: ${color} !important; }` };
  }

  if (section.key === 'subheading_color') {
    return { html, css: css + `\nh2, h3, h2 *, h3 * { color: ${color} !important; }` };
  }

  if (section.key === 'button_bg_color') {
    return { html, css: css + `\nbutton, input[type="submit"], a[class*="btn"], a[class*="button"] { background: ${color} !important; background-color: ${color} !important; border-color: ${color} !important; }` };
  }

  if (section.key === 'button_text_color') {
    return { html, css: css + `\nbutton, input[type="submit"], a[class*="btn"], a[class*="button"] { color: ${color} !important; }` };
  }

  if (section.type === 'placeholder') {
    let newHtml = html;
    // email
    if (section.key === 'email_placeholder') {
      newHtml = newHtml.replace(/(<input[^>]*type=["']email["'][^>]*?)placeholder=["'][^"']*["']/gi, `$1placeholder="${newValue}"`);
      if (newHtml !== html) return { html: newHtml, css };
    }
    // tel / phone
    if (section.key === 'phone_placeholder') {
      newHtml = newHtml.replace(/(<input[^>]*type=["']tel["'][^>]*?)placeholder=["'][^"']*["']/gi, `$1placeholder="${newValue}"`);
      if (newHtml !== html) return { html: newHtml, css };
      newHtml = html.replace(/(<input[^>]*placeholder=["'][^"']*(?:phone|whatsapp)[^"']*["'][^>]*?)placeholder=["'][^"']*["']/gi, `$1placeholder="${newValue}"`);
      if (newHtml !== html) return { html: newHtml, css };
    }
    // name
    if (section.key === 'name_placeholder') {
      newHtml = newHtml.replace(/(<input[^>]*(?:name=["'][^"']*name[^"']*["']|placeholder=["'][^"']*(?:name|your name)[^"']*["'])[^>]*?)placeholder=["'][^"']*["']/gi, `$1placeholder="${newValue}"`);
      if (newHtml !== html) return { html: newHtml, css };
    }
    // last resort: first input placeholder
    newHtml = html.replace(/(<input[^>]*?)placeholder=["'][^"']*["']/, `$1placeholder="${newValue}"`);
    return { html: newHtml, css };
  }

  if (section.type === 'select') {
    const options = newValue.split(',').map(o => o.trim()).filter(Boolean);
    return { html: applySelectOptions(html, options), css };
  }

  // text / button - use DOMParser then regex-escape replace
  const doc = new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');
  let el: Element | null = null;
  for (const sel of section.selector.split(',').map(s => s.trim())) {
    try { el = doc.querySelector(sel); } catch {}
    if (el) break;
  }
  if (!el) return { html, css };

  const original = el.outerHTML;

  if (section.type === 'button') {
    if (el.tagName === 'INPUT') {
      (el as HTMLInputElement).value = newValue;
    } else {
      const hasChild = Array.from(el.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE);
      if (hasChild) {
        let done = false;
        el.childNodes.forEach(n => {
          if (!done && n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) { n.textContent = newValue; done = true; }
        });
        if (!done) el.textContent = newValue;
      } else {
        el.textContent = newValue;
      }
    }
  } else {
    const hasChild = Array.from(el.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE);
    if (hasChild) {
      let done = false;
      el.childNodes.forEach(n => {
        if (!done && n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) { n.textContent = newValue; done = true; }
      });
      if (!done) el.textContent = newValue;
    } else {
      el.textContent = newValue;
    }
  }

  const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { html: html.replace(new RegExp(escaped), el.outerHTML), css };
}

// Dropdown editor component
function DropdownEditor({ initialOptions, onSave, onCancel }: {
  initialOptions: string[];
  onSave: (options: string[]) => void;
  onCancel: () => void;
}) {
  const [options, setOptions] = useState<string[]>(initialOptions.length ? initialOptions : ['']);

  const update = (i: number, val: string) => setOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  const remove = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));
  const add = () => setOptions(prev => [...prev, '']);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Edit, add or remove options:</p>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-1">
            <input
              type="text"
              value={opt}
              onChange={e => update(i, e.target.value)}
              className="flex-1 px-2 py-1 text-xs border rounded bg-background text-foreground"
              placeholder={`Option ${i + 1}`}
            />
            <button onClick={() => remove(i)} className="p-1 text-red-500 hover:text-red-700">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className="flex items-center gap-1 text-xs text-primary hover:underline">
        <Plus className="w-3 h-3" /> Add option
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(options.filter(o => o.trim()))}
          className="flex-1 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Save Options
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-accent">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function WebsiteBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = location.state?.templateId;
  const websiteIdFromState = location.state?.websiteId as string | undefined;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const [template, setTemplate] = useState<Template | null>(null);
  const [website, setWebsite] = useState<UserWebsite | null>(null);
  const [websiteName, setWebsiteName] = useState('');
  const [websiteSlug, setWebsiteSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [listSaving, setListSaving] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [currentCss, setCurrentCss] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  useEffect(() => {
    if (!user) { navigate('/templates'); return; }
    if (!templateId && !websiteIdFromState) { navigate('/templates'); return; }
    loadData();
    loadEmailLists();
  }, [templateId, websiteIdFromState, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadData = async () => {
    try {
      // Support both edit-by-websiteId and create-by-templateId flows
      let resolvedTemplateId = templateId;

      if (websiteIdFromState) {
        // Coming from My Websites "Edit" button — load website directly
        const { data: ws } = await supabase
          .from('user_websites').select('*').eq('id', websiteIdFromState).single();
        if (!ws) { navigate('/my-websites'); return; }
        resolvedTemplateId = ws.template_id;
        const tmpl = await templateService.getById(resolvedTemplateId);
        if (!tmpl) { navigate('/my-websites'); return; }
        setTemplate(tmpl);
        setWebsite(ws);
        setWebsiteName(ws.name);
        setWebsiteSlug(ws.slug);
        const customization = await websiteCustomizationService.getByWebsiteId(ws.id);
        setCurrentHtml(customization?.html_modifications?.custom_html || tmpl.html_content || '');
        setCurrentCss(customization?.css_modifications?.custom_css || tmpl.css_content || '');
        setSelectedListId(customization?.text_replacements?.connected_list_id ?? '');
        const savedChat = customization?.customization_history ?? [];
        setChatHistory(savedChat.length > 0 ? savedChat : [{ role: 'ai', text: '✓ Welcome back! Pick a section below to continue editing.' }]);
        return;
      }

      if (!resolvedTemplateId) { navigate('/templates'); return; }
      const tmpl = await templateService.getById(resolvedTemplateId);
      if (!tmpl) { navigate('/templates'); return; }
      setTemplate(tmpl);

      // Check if this user already has a website for this template
      const { data: existingWebsites } = await supabase
        .from('user_websites')
        .select('*')
        .eq('user_id', user!.id)
        .eq('template_id', resolvedTemplateId)
        .order('created_at', { ascending: false })
        .limit(1);

      const existingWebsite = existingWebsites?.[0] ?? null;

      if (existingWebsite) {
        setWebsite(existingWebsite);
        setWebsiteName(existingWebsite.name);
        setWebsiteSlug(existingWebsite.slug);

        // Load saved customization
        const customization = await websiteCustomizationService.getByWebsiteId(existingWebsite.id);
        const savedHtml = customization?.html_modifications?.custom_html;
        const savedCss = customization?.css_modifications?.custom_css;
        const savedListId = customization?.text_replacements?.connected_list_id ?? '';
        const savedChat = customization?.customization_history ?? [];

        setCurrentHtml(savedHtml || tmpl.html_content || '');
        setCurrentCss(savedCss || tmpl.css_content || '');
        setSelectedListId(savedListId);
        if (savedChat.length > 0) {
          setChatHistory(savedChat);
        } else {
          setChatHistory([{ role: 'ai', text: '✓ Welcome back! Pick a section below to continue editing.' }]);
        }
      } else {
        setWebsiteName(tmpl.name);
        setWebsiteSlug(tmpl.slug);
        setCurrentHtml(tmpl.html_content || '');
        setCurrentCss(tmpl.css_content || '');
      }
    } catch { navigate('/templates'); }
    finally { setLoading(false); }
  };

  const loadEmailLists = async () => {
    try {
      const { data } = await supabase.from('email_lists').select('*')
        .eq('user_id', user?.id).eq('status', 'active').order('name');
      setEmailLists(data || []);
    } catch {}
  };

  const handleCreateWebsite = async () => {
    if (!template || !user || !websiteName.trim()) return;
    setSaving(true);
    try {
      const timestamp = Date.now();
      const baseSlug = websiteSlug || websiteName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const uniqueSlug = `${baseSlug}-${timestamp}`;
      const subdomain = uniqueSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const newWebsite = await userWebsiteService.create({
        user_id: user.id, template_id: template.id,
        name: websiteName, slug: uniqueSlug, status: 'draft', subdomain,
      });
      setWebsite(newWebsite);
      const initialChat: { role: 'user' | 'ai'; text: string }[] = [
        { role: 'ai', text: '✓ Website created! Pick a section below to start editing.' }
      ];
      await websiteCustomizationService.createOrUpdate(newWebsite.id, {
        html_modifications: { custom_html: currentHtml },
        css_modifications: { custom_css: currentCss },
        js_modifications: {},
        text_replacements: { connected_list_id: '' },
        section_order: [],
        customization_history: initialChat,
      });
      setChatHistory(initialChat);
    } catch {
      setChatHistory([{ role: 'ai', text: '✗ Error creating website. Please try again.' }]);
    } finally { setSaving(false); }
  };

  const handleListChange = async (listId: string) => {
    setSelectedListId(listId);
    if (!website) return;
    setListSaving(true);
    try {
      await saveAll(currentHtml, currentCss, listId, chatHistory);
    } catch {} finally { setListSaving(false); }
  };

  const saveAll = async (html: string, css: string, listId: string, chat: { role: 'user' | 'ai'; text: string }[]) => {
    if (!website) return;
    await websiteCustomizationService.createOrUpdate(website.id, {
      html_modifications: { custom_html: html },
      css_modifications: { custom_css: css },
      js_modifications: {},
      text_replacements: { connected_list_id: listId },
      section_order: [],
      customization_history: chat,
    });
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    setAiMessage('');
    const colorKeys = ['theme_color', 'heading_color', 'subheading_color', 'button_bg_color', 'button_text_color'];
    if (section.type === 'select') {
      const opts = getSelectOptions(currentHtml);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: `Dropdown / Select selected.\n\nCurrent options:\n${opts.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nUse the editor below to add, edit or delete options.`
      }]);
    } else if (colorKeys.includes(section.key)) {
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: `You selected: ${section.label}.\n\nType any color name (e.g. red, blue, green, purple, orange, pink, teal, gold, navy...) or a hex code like #ff5733.`
      }]);
    } else {
      const current = getCurrentValue(currentHtml, section);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: `You selected: ${section.label}.${current ? ` Current value: "${current}".` : ''}\n\nWhat would you like to change it to?`
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!website || !aiMessage.trim() || !selectedSection) return;
    setSaving(true);
    const userMsg = aiMessage.trim();
    setAiMessage('');
    const newValue = userMsg.replace(/^(change\s+(it\s+)?to|set\s+(it\s+)?to|make\s+(it\s+)?|update\s+(it\s+)?to)\s+/i, '').trim();
    const { html: updatedHtml, css: updatedCss } = applyTextChange(currentHtml, currentCss, selectedSection, newValue);
    const colorKeys = ['theme_color', 'heading_color', 'subheading_color', 'button_bg_color', 'button_text_color'];
    const success = updatedHtml !== currentHtml || updatedCss !== currentCss || colorKeys.includes(selectedSection.key);
    const newChat: { role: 'user' | 'ai'; text: string }[] = [
      ...chatHistory,
      { role: 'user', text: userMsg },
      { role: 'ai', text: success
        ? `✓ Done! "${selectedSection.label}" updated to "${newValue}".\n\nWhat section do you want to edit next?`
        : `⚠️ Could not find "${selectedSection.label}" in this template. Pick another section.`
      }
    ];
    if (success) {
      setCurrentHtml(updatedHtml);
      setCurrentCss(updatedCss);
      try { await saveAll(updatedHtml, updatedCss, selectedListId, newChat); } catch {}
    } else {
      try { await saveAll(currentHtml, currentCss, selectedListId, newChat); } catch {}
    }
    setChatHistory(newChat);
    setSelectedSection(null);
    setSaving(false);
  };

  const handleDropdownSave = async (options: string[]) => {
    const newHtml = applySelectOptions(currentHtml, options);
    const newChat: { role: 'user' | 'ai'; text: string }[] = [
      ...chatHistory,
      { role: 'ai', text: `✓ Dropdown updated with ${options.length} options: ${options.join(', ')}\n\nWhat section do you want to edit next?` }
    ];
    setCurrentHtml(newHtml);
    setChatHistory(newChat);
    try { await saveAll(newHtml, currentCss, selectedListId, newChat); } catch {}
    setSelectedSection(null);
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!template) return <div className="w-full h-full flex items-center justify-center"><p className="text-muted-foreground">Template not found</p></div>;

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => navigate('/my-websites')} className="text-xs text-muted-foreground hover:text-foreground">← My Websites</button>
            </div>
            <h1 className="text-3xl font-bold mb-1">Website Builder</h1>
            <p className="text-muted-foreground">Customize {template.name} with AI</p>
          </div>
          {website && (
            <Link to={`/website-builder/analytics/${website.id}`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent text-sm">
              <Eye className="w-4 h-4" /> Analytics
            </Link>
          )}
        </div>

        {/* Live link bar */}
        {website && (
          <div className="bg-card border rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Globe className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate">bizsuiteai.vercel.app/preview/{website.id}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { navigator.clipboard.writeText(`https://bizsuiteai.vercel.app/preview/${website.id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-accent"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => window.open(`https://bizsuiteai.vercel.app/preview/${website.id}`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-accent"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={() => {
                  const url = `https://bizsuiteai.vercel.app/preview/${website.id}`;
                  if (navigator.share) { navigator.share({ title: website.name, url }); }
                  else { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Globe className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>
        )}

        {!website ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create Your Website</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Website Name</label>
                <input type="text" value={websiteName} onChange={e => setWebsiteName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="My Awesome Website" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website Slug</label>
                <input type="text" value={websiteSlug} onChange={e => setWebsiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="my-awesome-website" />
                <p className="text-xs text-muted-foreground mt-1">Available at: <strong>{websiteSlug}-xxxx.bizsuiteai.com</strong></p>
              </div>
              <button onClick={handleCreateWebsite} disabled={saving || !websiteName.trim()}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Save className="w-4 h-4" />Create Website</>}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Preview */}
            <div className="col-span-2 bg-card border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 border-b">
                <p className="text-sm font-medium">{website.name}</p>
                <p className="text-xs text-muted-foreground">{website.subdomain}.bizsuiteai.com</p>
              </div>
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${currentCss}</style></head><body>${currentHtml.replace(/<form[^>]*>/g, `<form action="/api/form-submit" method="POST" data-list-id="${selectedListId}">`)}<script>document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('form').forEach(f=>{f.addEventListener('submit',function(e){e.preventDefault();alert('Form submitted!');});});});${template.js_content || ''}<\/script></body></html>`}
                className="w-full h-[600px]" title="Website Preview"
              />
            </div>

            {/* AI Sidebar */}
            <div className="bg-card border rounded-lg p-4 flex flex-col h-[600px]">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> AI Customization
              </h3>

              {/* Email list connector */}
              {template.form_fields && template.form_fields.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <label className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1 block">Connect Form to Email List:</label>
                  <select value={selectedListId} onChange={e => handleListChange(e.target.value)}
                    className="w-full text-xs px-2 py-1 border border-blue-300 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none">
                    <option value="">Select a list...</option>
                    {emailLists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                  </select>
                  {selectedListId && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {listSaving ? '⏳ Saving...' : `✓ Connected to: ${emailLists.find(l => l.id === selectedListId)?.name}`}
                    </p>
                  )}
                </div>
              )}

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto mb-3 space-y-2 text-sm">
                {chatHistory.length === 0 && (
                  <p className="text-muted-foreground text-xs text-center mt-4">Pick a section below to start editing.</p>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`p-2 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted text-foreground mr-4'}`}>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Section picker */}
              {!selectedSection && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Which section do you want to edit?</p>
                  <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
                    {SECTIONS.map(section => (
                      <button key={section.key} onClick={() => handleSectionSelect(section)}
                        className="text-left px-2 py-1.5 text-xs border rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropdown editor */}
              {selectedSection?.type === 'select' && (
                <DropdownEditor
                  initialOptions={getSelectOptions(currentHtml)}
                  onSave={handleDropdownSave}
                  onCancel={() => setSelectedSection(null)}
                />
              )}

              {/* Text input for non-select sections */}
              {selectedSection && selectedSection.type !== 'select' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-primary">Editing: {selectedSection.label}</p>
                    <button onClick={() => setSelectedSection(null)} className="text-xs text-muted-foreground hover:text-foreground">✕ Cancel</button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiMessage}
                      onChange={e => setAiMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`Type new ${selectedSection.label.toLowerCase()}...`}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                    <button onClick={handleSendMessage} disabled={saving || !aiMessage.trim()}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '→'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
