import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { templateCategoryService } from '@/lib/website-builder-service';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface DebugLog {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: number;
}

export default function TemplateGalleryDebugPage() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addLog = (step: string, status: 'pending' | 'success' | 'error', message: string) => {
    setLogs((prev) => [...prev, { step, status, message, timestamp: Date.now() }]);
    console.log(`[${status.toUpperCase()}] ${step}: ${message}`);
  };

  const testConnection = async () => {
    setLogs([]);
    setLoading(true);

    try {
      addLog('Connection', 'pending', 'Testing Supabase connection...');
      const { data, error } = await supabase.from('template_categories').select('count');
      if (error) throw error;
      addLog('Connection', 'success', 'Supabase connection OK');
    } catch (error: any) {
      addLog('Connection', 'error', `Connection failed: ${error.message}`);
    }
  };

  const loadCategories = async () => {
    setLogs([]);
    setLoading(true);

    try {
      addLog('Categories', 'pending', 'Fetching template categories...');
      const data = await templateCategoryService.getAll();
      addLog('Categories', 'success', `Loaded ${data.length} categories`);
      setCategories(data);

      if (data.length > 0) {
        addLog('Categories', 'success', `Categories: ${data.map((c) => c.name).join(', ')}`);
        setSelectedCategory(data[0].id);
      } else {
        addLog('Categories', 'error', 'No categories found');
      }
    } catch (error: any) {
      addLog('Categories', 'error', `Failed to load categories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (categoryId: string) => {
    setLogs([]);
    setLoading(true);

    try {
      addLog('Templates', 'pending', `Fetching templates for category ${categoryId}...`);

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (error) throw error;

      addLog('Templates', 'success', `Loaded ${data?.length || 0} templates`);
      setTemplates(data || []);

      if (data && data.length > 0) {
        data.forEach((template, index) => {
          addLog(
            'Templates',
            'success',
            `Template ${index + 1}: ${template.name} (${template.form_fields?.length || 0} form fields)`
          );
        });
      } else {
        addLog('Templates', 'error', 'No templates found in this category');
      }
    } catch (error: any) {
      addLog('Templates', 'error', `Failed to load templates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFullFlow = async () => {
    setLogs([]);
    setLoading(true);

    try {
      // Step 1: Connection
      addLog('Full Flow', 'pending', 'Step 1: Testing connection...');
      const { data: connTest, error: connError } = await supabase.from('template_categories').select('count');
      if (connError) throw connError;
      addLog('Full Flow', 'success', 'Step 1: Connection OK');

      // Step 2: Load categories
      addLog('Full Flow', 'pending', 'Step 2: Loading categories...');
      const categories = await templateCategoryService.getAll();
      addLog('Full Flow', 'success', `Step 2: Loaded ${categories.length} categories`);

      if (categories.length === 0) {
        addLog('Full Flow', 'error', 'No categories found - database may be empty');
        setLoading(false);
        return;
      }

      // Step 3: Load templates for first category
      addLog('Full Flow', 'pending', `Step 3: Loading templates for "${categories[0].name}"...`);
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .eq('category_id', categories[0].id)
        .eq('is_active', true);

      if (templatesError) throw templatesError;
      addLog('Full Flow', 'success', `Step 3: Loaded ${templatesData?.length || 0} templates`);

      if (templatesData && templatesData.length > 0) {
        addLog('Full Flow', 'success', `First template: ${templatesData[0].name}`);
        addLog('Full Flow', 'success', `Template has HTML: ${templatesData[0].html_content?.length || 0} chars`);
        addLog('Full Flow', 'success', `Template has CSS: ${templatesData[0].css_content?.length || 0} chars`);
      }

      setCategories(categories);
      setTemplates(templatesData || []);
      setSelectedCategory(categories[0].id);
      addLog('Full Flow', 'success', 'Full flow completed successfully!');
    } catch (error: any) {
      addLog('Full Flow', 'error', `Flow failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Template Gallery Debug</h1>
          <p className="text-muted-foreground">Detailed debugging for template loading issues</p>
        </div>

        {/* Controls */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Debug Tests</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Test Connection
            </button>
            <button
              onClick={loadCategories}
              disabled={loading}
              className="bg-green-500/20 text-green-600 hover:bg-green-500/30 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Load Categories
            </button>
            <button
              onClick={() => selectedCategory && loadTemplates(selectedCategory)}
              disabled={loading || !selectedCategory}
              className="bg-purple-500/20 text-purple-600 hover:bg-purple-500/30 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Load Templates
            </button>
            <button
              onClick={testFullFlow}
              disabled={loading}
              className="bg-orange-500/20 text-orange-600 hover:bg-orange-500/30 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Full Flow Test
            </button>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Debug Logs</h2>
          <div className="bg-muted rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">Click a test button to see logs...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  {log.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-yellow-500 flex-shrink-0 mt-0.5" />}
                  {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                  {log.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <span className="font-semibold">{log.step}:</span>
                    <span className="text-muted-foreground ml-2">{log.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Results */}
        {categories.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Categories Loaded</h2>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    loadTemplates(cat.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {templates.length > 0 && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Templates Loaded ({templates.length})</h2>
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="bg-muted p-3 rounded-lg space-y-1">
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>HTML: {template.html_content?.length || 0} chars</p>
                    <p>CSS: {template.css_content?.length || 0} chars</p>
                    <p>Form Fields: {template.form_fields?.length || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.some((l) => l.status === 'error') && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-600 font-semibold">Errors detected - see logs above</p>
          </div>
        )}
      </div>
    </div>
  );
}
