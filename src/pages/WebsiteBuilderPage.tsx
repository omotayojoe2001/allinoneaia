import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { templateService, userWebsiteService, websiteCustomizationService } from '@/lib/website-builder-service';
import { Template, UserWebsite } from '@/lib/website-builder-types';
import { Loader2, Save, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WebsiteBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = location.state?.templateId;

  const [template, setTemplate] = useState<Template | null>(null);
  const [website, setWebsite] = useState<UserWebsite | null>(null);
  const [websiteName, setWebsiteName] = useState('');
  const [websiteSlug, setWebsiteSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [customizationHistory, setCustomizationHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!templateId || !user) {
      navigate('/templates');
      return;
    }
    loadTemplate();
  }, [templateId, user]);

  const loadTemplate = async () => {
    try {
      const data = await templateService.getById(templateId);
      if (!data) {
        navigate('/templates');
        return;
      }
      setTemplate(data);
      setWebsiteName(data.name);
      setWebsiteSlug(data.slug);
    } catch (error) {
      console.error('Error loading template:', error);
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebsite = async () => {
    if (!template || !user || !websiteName.trim()) return;

    setSaving(true);
    try {
      // Generate subdomain
      const subdomain = `${websiteSlug}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

      // Create website
      const newWebsite = await userWebsiteService.create({
        user_id: user.id,
        template_id: template.id,
        name: websiteName,
        slug: websiteSlug,
        status: 'draft',
        subdomain,
      });

      setWebsite(newWebsite);

      // Create customization record
      await websiteCustomizationService.createOrUpdate(newWebsite.id, {
        html_modifications: {},
        css_modifications: {},
        js_modifications: {},
        text_replacements: {},
        section_order: [],
        customization_history: [],
      });

      // Show success
      setCustomizationHistory(['✓ Website created successfully']);
    } catch (error) {
      console.error('Error creating website:', error);
      setCustomizationHistory(['✗ Error creating website']);
    } finally {
      setSaving(false);
    }
  };

  const handleAICustomization = async () => {
    if (!website || !aiMessage.trim()) return;

    setSaving(true);
    try {
      // Add to history
      setCustomizationHistory([...customizationHistory, `📝 You: ${aiMessage}`]);

      // TODO: Call OpenAI API to process customization
      // For now, just acknowledge
      setCustomizationHistory((prev) => [
        ...prev,
        '🤖 AI: Processing your request... (Coming soon)',
      ]);

      setAiMessage('');
    } catch (error) {
      console.error('Error processing customization:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Template not found</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Website Builder</h1>
            <p className="text-muted-foreground">Customize {template.name} with AI</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <MessageSquare className="w-4 h-4" />
              AI Customize
            </button>
          </div>
        </div>

        {!website ? (
          // Website Creation Form
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold">Create Your Website</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Website Name</label>
                <input
                  type="text"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="My Awesome Website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website Slug</label>
                <input
                  type="text"
                  value={websiteSlug}
                  onChange={(e) => setWebsiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="my-awesome-website"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your website will be available at: <strong>{websiteSlug}-xxxx.bizsuiteai.com</strong>
                </p>
              </div>

              <button
                onClick={handleCreateWebsite}
                disabled={saving || !websiteName.trim()}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Website
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          // Website Editor
          <div className="grid grid-cols-3 gap-6">
            {/* Preview */}
            <div className="col-span-2 bg-card border rounded-lg overflow-hidden">
              <div className="bg-muted p-4 border-b">
                <p className="text-sm font-medium">{website.name}</p>
                <p className="text-xs text-muted-foreground">{website.subdomain}.bizsuiteai.com</p>
              </div>
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>${template.css_content || ''}</style>
                    </head>
                    <body>
                      ${template.html_content}
                      <script>${template.js_content || ''}</script>
                    </body>
                  </html>
                `}
                className="w-full h-[600px]"
                title="Website Preview"
              />
            </div>

            {/* AI Chat Sidebar */}
            <div className="bg-card border rounded-lg p-4 flex flex-col h-[600px]">
              <h3 className="font-semibold mb-4">AI Customization</h3>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-2 text-sm">
                {customizationHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded ${
                      msg.startsWith('📝') ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'
                    }`}
                  >
                    {msg}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="space-y-2">
                <textarea
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Tell AI what to change... e.g., 'Move testimonials to top' or 'Change business name to XYZ'"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
                <button
                  onClick={handleAICustomization}
                  disabled={saving || !aiMessage.trim()}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
