import { supabase } from './supabase';
import {
  Template,
  TemplateCategory,
  UserWebsite,
  WebsiteCustomization,
  WebsiteForm,
  FormSubmission,
  WebsiteAnalytics,
  AICustomizationRequest,
  AICustomizationResponse,
} from './website-builder-types';

// Template Categories
export const templateCategoryService = {
  async getAll(): Promise<TemplateCategory[]> {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getBySlug(slug: string): Promise<TemplateCategory | null> {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
};

// Templates
export const templateService = {
  async getAll(categoryId?: string): Promise<Template[]> {
    let query = supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getByCategory(categorySlug: string): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*, template_categories(id, name, slug)')
      .eq('is_active', true)
      .eq('template_categories.slug', categorySlug)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Template | null> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async create(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .insert([template])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// User Websites
export const userWebsiteService = {
  async getAll(userId: string): Promise<UserWebsite[]> {
    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id: string, userId: string): Promise<UserWebsite | null> {
    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async getBySubdomain(subdomain: string): Promise<UserWebsite | null> {
    const { data, error } = await supabase
      .from('user_websites')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('status', 'published')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async create(website: Omit<UserWebsite, 'id' | 'created_at' | 'updated_at'>): Promise<UserWebsite> {
    const { data, error } = await supabase
      .from('user_websites')
      .insert([website])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, userId: string, updates: Partial<UserWebsite>): Promise<UserWebsite> {
    const { data, error } = await supabase
      .from('user_websites')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_websites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};

// Website Customizations
export const websiteCustomizationService = {
  async getByWebsiteId(websiteId: string): Promise<WebsiteCustomization | null> {
    const { data, error } = await supabase
      .from('website_customizations')
      .select('*')
      .eq('website_id', websiteId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async createOrUpdate(websiteId: string, customization: Partial<WebsiteCustomization>): Promise<WebsiteCustomization> {
    const existing = await this.getByWebsiteId(websiteId);

    if (existing) {
      const { data, error } = await supabase
        .from('website_customizations')
        .update({
          ...customization,
          updated_at: new Date().toISOString(),
        })
        .eq('website_id', websiteId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('website_customizations')
        .insert([{ website_id: websiteId, ...customization }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async addToHistory(websiteId: string, record: any): Promise<void> {
    const customization = await this.getByWebsiteId(websiteId);
    if (!customization) return;

    const history = customization.customization_history || [];
    history.push({
      ...record,
      timestamp: new Date().toISOString(),
    });

    await this.createOrUpdate(websiteId, {
      customization_history: history,
      last_customized_at: new Date().toISOString(),
    });
  },
};

// Website Forms
export const websiteFormService = {
  async getByWebsiteId(websiteId: string): Promise<WebsiteForm[]> {
    const { data, error } = await supabase
      .from('website_forms')
      .select('*')
      .eq('website_id', websiteId);
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<WebsiteForm | null> {
    const { data, error } = await supabase
      .from('website_forms')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async create(form: Omit<WebsiteForm, 'id' | 'created_at' | 'updated_at'>): Promise<WebsiteForm> {
    const { data, error } = await supabase
      .from('website_forms')
      .insert([form])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<WebsiteForm>): Promise<WebsiteForm> {
    const { data, error } = await supabase
      .from('website_forms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// Form Submissions
export const formSubmissionService = {
  async create(submission: Omit<FormSubmission, 'id' | 'created_at'>): Promise<FormSubmission> {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert([submission])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByFormId(formId: string, limit = 50): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getByWebsiteId(websiteId: string, limit = 100): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('website_id', websiteId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async updateAutomationStatus(
    id: string,
    automationType: 'email' | 'whatsapp' | 'sms',
    triggered: boolean
  ): Promise<void> {
    const updateData: any = {};
    updateData[`${automationType}_sequence_triggered`] = triggered;
    updateData.automation_triggered = triggered;

    const { error } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', id);
    if (error) throw error;
  },
};

// Website Analytics
export const websiteAnalyticsService = {
  async getByWebsiteId(websiteId: string): Promise<WebsiteAnalytics | null> {
    const { data, error } = await supabase
      .from('website_analytics')
      .select('*')
      .eq('website_id', websiteId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async incrementPageView(websiteId: string): Promise<void> {
    const analytics = await this.getByWebsiteId(websiteId);

    if (analytics) {
      await supabase
        .from('website_analytics')
        .update({
          page_views: analytics.page_views + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('website_id', websiteId);
    }
  },

  async incrementFormSubmission(websiteId: string): Promise<void> {
    const analytics = await this.getByWebsiteId(websiteId);

    if (analytics) {
      const newSubmissions = analytics.form_submissions + 1;
      const conversionRate = analytics.page_views > 0 ? (newSubmissions / analytics.page_views) * 100 : 0;

      await supabase
        .from('website_analytics')
        .update({
          form_submissions: newSubmissions,
          conversion_rate: conversionRate,
        })
        .eq('website_id', websiteId);
    }
  },
};

// AI Customization (to be implemented with OpenAI)
export const aiCustomizationService = {
  async processCustomization(request: AICustomizationRequest): Promise<AICustomizationResponse> {
    // This will be implemented with OpenAI API
    // For now, returning placeholder
    return {
      success: false,
      changes: {},
      error: 'AI customization service not yet implemented',
    };
  },
};
