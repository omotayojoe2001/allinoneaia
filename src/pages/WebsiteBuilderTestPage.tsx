import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';

export default function WebsiteBuilderTestPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'gallery' | 'builder'>('gallery');

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <Zap className="w-8 h-8 text-primary" />
            Website Builder Test
          </h1>
          <p className="text-muted-foreground">Test the template gallery and website builder</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'gallery'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Template Gallery
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'builder'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Website Builder
          </button>
        </div>

        {/* Content */}
        {activeTab === 'gallery' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold">Template Gallery</h2>
              <p className="text-muted-foreground">
                Browse beautiful landing page templates and customize them with AI.
              </p>

              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Features:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Browse templates by category (Landing Page, Event, Sales, Waitlist, Wedding, Newsletter)</li>
                    <li>✓ Preview templates in modal</li>
                    <li>✓ One-click "Use Template" to create website</li>
                    <li>✓ Beautiful template cards with descriptions</li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/templates')}
                  className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Open Template Gallery
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold">Website Builder</h2>
              <p className="text-muted-foreground">
                Create and customize websites from templates using AI instructions.
              </p>

              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Features:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Create website from template</li>
                    <li>✓ Set website name and slug</li>
                    <li>✓ Auto-generate subdomain (e.g., my-website-xxxx.bizsuiteai.com)</li>
                    <li>✓ Live preview of website</li>
                    <li>✓ AI customization chat (coming soon)</li>
                    <li>✓ Form builder to connect to email/WhatsApp/SMS</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-600">
                    <strong>How to test:</strong> Go to Template Gallery, select a template, click "Use Template", then fill in the website details.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/templates')}
                  className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Start with Template Gallery
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Current Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>✓ Database schema created</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>✓ 4 templates seeded (Modern SaaS, Event, Sales, Waitlist)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>✓ Template Gallery page working</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>✓ Website Builder page working</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>⏳ AI customization (OpenAI integration - next)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>⏳ Form builder (connect to email/WhatsApp/SMS - next)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>⏳ Publish & shareable links (next)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
