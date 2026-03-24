// Website Builder Types

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at: string;
}

export interface Template {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  preview_url?: string;
  html_content: string;
  css_content?: string;
  js_content?: string;
  form_fields: FormField[];
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWebsite {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  subdomain?: string;
  custom_domain?: string;
  custom_domain_verified: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WebsiteCustomization {
  id: string;
  website_id: string;
  html_modifications: Record<string, any>;
  css_modifications: Record<string, any>;
  js_modifications: Record<string, any>;
  text_replacements: Record<string, string>;
  section_order: string[];
  customization_history: CustomizationRecord[];
  last_customized_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomizationRecord {
  instruction: string;
  changes: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface WebsiteForm {
  id: string;
  website_id: string;
  form_name: string;
  form_type: 'contact' | 'newsletter' | 'event' | 'waitlist' | 'sales' | 'wedding' | 'other';
  list_id: string;
  automation_type: 'email' | 'whatsapp' | 'sms' | 'multi';
  email_sequence_id?: string;
  whatsapp_sequence_id?: string;
  sms_sequence_id?: string;
  form_fields: FormField[];
  field_mapping: Record<string, string>;
  success_message?: string;
  redirect_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  website_id: string;
  user_id: string;
  contact_id?: string;
  submission_data: Record<string, any>;
  email?: string;
  phone?: string;
  automation_triggered: boolean;
  email_sequence_triggered: boolean;
  whatsapp_sequence_triggered: boolean;
  sms_sequence_triggered: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface WebsiteAnalytics {
  id: string;
  website_id: string;
  user_id: string;
  page_views: number;
  unique_visitors: number;
  form_submissions: number;
  conversion_rate: number;
  last_viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AICustomizationRequest {
  website_id: string;
  instruction: string;
  context?: Record<string, any>;
}

export interface AICustomizationResponse {
  success: boolean;
  changes: {
    html?: string;
    css?: string;
    js?: string;
    text_replacements?: Record<string, string>;
    section_order?: string[];
  };
  preview_html?: string;
  error?: string;
}
