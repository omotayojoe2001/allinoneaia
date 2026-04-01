import { supabase } from '@/lib/supabase';

export interface FormSubmissionData {
  listId: string;
  websiteId: string;
  formData: Record<string, any>;
}

export async function handleFormSubmission(data: FormSubmissionData) {
  try {
    const { listId, websiteId, formData } = data;

    // Extract common fields
    const email = formData.email || formData.Email || formData.EMAIL;
    const firstName = formData.first_name || formData.firstName || formData.name || formData.Name || '';
    const lastName = formData.last_name || formData.lastName || '';
    const phone = formData.phone || formData.Phone || formData.tel || '';

    if (!email) {
      throw new Error('Email is required');
    }

    // Check if subscriber already exists in this list
    const { data: existingSubscriber } = await supabase
      .from('email_subscribers')
      .select('id')
      .eq('list_id', listId)
      .eq('email', email)
      .single();

    if (existingSubscriber) {
      // Update existing subscriber
      await supabase
        .from('email_subscribers')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscriber.id);
    } else {
      // Add new subscriber
      await supabase
        .from('email_subscribers')
        .insert({
          list_id: listId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          status: 'active',
        });
    }

    // Store form submission record
    await supabase
      .from('form_submissions')
      .insert({
        website_id: websiteId,
        form_data: formData,
        submitted_at: new Date().toISOString(),
        email: email,
        phone: phone,
      });

    return { success: true, message: 'Form submitted successfully' };
  } catch (error) {
    console.error('Form submission error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Submission failed' };
  }
}

export async function getFormSubmissions(websiteId: string) {
  try {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('website_id', websiteId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    return [];
  }
}