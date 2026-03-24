import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { templateCategoryService } from '@/lib/website-builder-service';
import { Template, TemplateCategory } from '@/lib/website-builder-types';
import { supabase } from '@/lib/supabase';
import { Loader2, Eye, Plus } from 'lucide-react';

export default function TemplateGalleryPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadTemplates(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const data = await templateCategoryService.getAll();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTemplates = async (categoryId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: Template) => {
    navigate('/website-builder/create', { state: { templateId: template.id } });
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Website Templates</h1>
          <p className="text-muted-foreground">Choose a beautiful template and customize it with AI</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border hover:bg-accent'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-purple-500/10 to-blue-500/10 overflow-hidden group">
                  <img
                    src={template.thumbnail_url || 'https://via.placeholder.com/400x300'}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>

                  {/* Form Fields Info */}
                  {template.form_fields && template.form_fields.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {template.form_fields.length} form field{template.form_fields.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Use Template Button */}
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Use Template
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No templates found in this category</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{previewTemplate.name}</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>${previewTemplate.css_content || ''}</style>
                    </head>
                    <body>
                      ${previewTemplate.html_content}
                      <script>${previewTemplate.js_content || ''}</script>
                    </body>
                  </html>
                `}
                className="w-full h-[600px] border rounded-lg"
                title="Template Preview"
              />
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
              >
                Use This Template
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
