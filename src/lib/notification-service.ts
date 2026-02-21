import { supabase } from '@/lib/supabase';

interface NotificationPayload {
  reminderId: string;
  userId: string;
  category: string;
  title: string;
  description?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  metadata?: Record<string, any>;
}

// Get API keys from Supabase
async function getApiKeys() {
  const { data, error } = await supabase
    .from('api_config')
    .select('service, api_key')
    .in('service', ['resend', 'whatsapp']);
  
  if (error) throw error;
  
  const keys: Record<string, string> = {};
  data?.forEach(item => {
    keys[item.service] = item.api_key;
  });
  
  return keys;
}

// Send email via Resend
export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const keys = await getApiKeys();
    const resendKey = keys.resend;
    
    if (!resendKey || !payload.recipientEmail) {
      throw new Error('Missing Resend API key or recipient email');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Reminders <reminders@yourdomain.com>',
        to: [payload.recipientEmail],
        subject: `Reminder: ${payload.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${payload.title}</h2>
            <p style="color: #666; line-height: 1.6;">${payload.description || ''}</p>
            <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
              <p style="margin: 0; color: #888; font-size: 12px;">Category: ${payload.category}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    await logNotification(payload.reminderId, 'email', 'sent');
    return true;
  } catch (error) {
    console.error('Email notification error:', error);
    await logNotification(payload.reminderId, 'email', 'failed', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Send WhatsApp message
export async function sendWhatsAppNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const keys = await getApiKeys();
    const whatsappKey = keys.whatsapp;
    
    if (!whatsappKey || !payload.recipientPhone) {
      throw new Error('Missing WhatsApp API key or recipient phone');
    }

    // Format phone number (remove non-digits)
    const phone = payload.recipientPhone.replace(/\D/g, '');
    
    const message = `*${payload.title}*\n\n${payload.description || ''}\n\n_Category: ${payload.category}_`;

    // Using WhatsApp Business API format
    const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: {
          body: message,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    await logNotification(payload.reminderId, 'whatsapp', 'sent');
    return true;
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    await logNotification(payload.reminderId, 'whatsapp', 'failed', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Send in-app push notification
export async function sendPushNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // Store in-app notification in database
    const { error } = await supabase
      .from('reminder_notifications')
      .insert({
        reminder_id: payload.reminderId,
        notification_type: 'in_app',
        status: 'sent',
        metadata: {
          title: payload.title,
          description: payload.description,
          category: payload.category,
        },
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    await logNotification(payload.reminderId, 'push', 'failed', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Helper to log notification
async function logNotification(
  reminderId: string,
  type: 'email' | 'whatsapp' | 'push' | 'in_app',
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  await supabase.rpc('log_notification', {
    reminder_uuid: reminderId,
    notif_type: type,
    notif_status: status,
    error_msg: errorMessage || null,
  });
}

// Send WhatsApp via Whapi.cloud
async function sendWhapiMessage(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer DURNULBh7CQBFgsSePFdryuBlDSMtWq9',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typing_time: 0,
        to: phone,
        body: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Whapi error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Whapi send error:', error);
    return false;
  }
}

// Send Email via Resend
async function sendResendEmail(email: string, subject: string, body: string): Promise<boolean> {
  try {
    const { data: config } = await supabase
      .from('api_config')
      .select('api_key')
      .eq('service', 'resend')
      .single();

    if (!config?.api_key) return false;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Campaigns <campaigns@yourdomain.com>',
        to: [email],
        subject: subject,
        html: body.replace(/\n/g, '<br>'),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Resend send error:', error);
    return false;
  }
}

// Process pending campaigns
export async function processPendingCampaigns() {
  try {
    const now = new Date().toISOString();
    console.log('[Campaign Processor] Checking for pending campaigns at:', now);
    
    const { data: campaigns, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now);
    
    if (error) {
      console.error('[Campaign Processor] Query error:', error);
      throw error;
    }
    
    console.log(`[Campaign Processor] Found ${campaigns?.length || 0} pending campaigns`);
    if (!campaigns || campaigns.length === 0) return;

    for (const campaign of campaigns) {
      console.log('[Campaign Processor] Processing campaign:', {
        id: campaign.id,
        target_type: campaign.target_type,
        target_phone: campaign.target_phone,
        scheduled_time: campaign.scheduled_time,
        send_via_whatsapp: campaign.send_via_whatsapp
      });

      let successCount = 0;
      let failCount = 0;

      // Handle individual messages
      if (campaign.target_type === 'individual') {
        if (campaign.send_via_whatsapp && campaign.target_phone) {
          console.log('[Campaign Processor] Sending WhatsApp to:', campaign.target_phone);
          const sent = await sendWhapiMessage(campaign.target_phone, campaign.message_body);
          console.log('[Campaign Processor] WhatsApp result:', sent ? 'SUCCESS' : 'FAILED');
          sent ? successCount++ : failCount++;
        }
        if (campaign.send_via_email && campaign.target_email) {
          console.log('[Campaign Processor] Sending Email to:', campaign.target_email);
          const sent = await sendResendEmail(
            campaign.target_email,
            campaign.email_subject || 'Message',
            campaign.message_body
          );
          console.log('[Campaign Processor] Email result:', sent ? 'SUCCESS' : 'FAILED');
          sent ? successCount++ : failCount++;
        }
      }
      // Handle list-based campaigns
      else if (campaign.target_type === 'list' && campaign.list_id) {
        console.log('[Campaign Processor] Processing list campaign, list_id:', campaign.list_id);
        const { data: subscribers } = await supabase
          .from('email_subscribers')
          .select('email, phone, first_name, last_name')
          .eq('list_id', campaign.list_id);

        console.log('[Campaign Processor] Found', subscribers?.length || 0, 'subscribers');

        if (!subscribers || subscribers.length === 0) {
          await supabase.from('scheduled_messages').update({ status: 'failed' }).eq('id', campaign.id);
          continue;
        }

        for (const subscriber of subscribers) {
          let message = campaign.message_body || '';
          message = message.replace(/{{first_name}}/g, subscriber.first_name || '');
          message = message.replace(/{{last_name}}/g, subscriber.last_name || '');
          message = message.replace(/{{phone}}/g, subscriber.phone || '');

          if (campaign.send_via_whatsapp && subscriber.phone) {
            const sent = await sendWhapiMessage(subscriber.phone, message);
            sent ? successCount++ : failCount++;
          }
          
          if (campaign.send_via_email && subscriber.email) {
            const sent = await sendResendEmail(
              subscriber.email,
              campaign.email_subject || 'Campaign Message',
              message
            );
            sent ? successCount++ : failCount++;
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('[Campaign Processor] Campaign results:', { successCount, failCount });
      console.log('[Campaign Processor] Updating campaign status to:', failCount === 0 ? 'sent' : 'partial');

      const { error: updateError } = await supabase
        .from('scheduled_messages')
        .update({ 
          status: failCount === 0 ? 'sent' : 'partial',
          sent_at: new Date().toISOString()
        })
        .eq('id', campaign.id);

      if (updateError) {
        console.error('[Campaign Processor] Update error:', updateError);
      } else {
        console.log('[Campaign Processor] Campaign updated successfully');
      }
    }

    console.log('[Campaign Processor] Processing complete');
  } catch (error) {
    console.error('[Campaign Processor] Fatal error:', error);
  }
}

// Process all pending reminders
export async function processPendingReminders() {
  try {
    // Get pending reminders
    const { data: reminders, error } = await supabase.rpc('process_pending_reminders');
    
    if (error) throw error;
    if (!reminders || reminders.length === 0) return;

    console.log(`Processing ${reminders.length} pending reminders...`);

    for (const reminder of reminders) {
      const payload: NotificationPayload = {
        reminderId: reminder.reminder_id,
        userId: reminder.user_id,
        category: reminder.category,
        title: reminder.title,
        recipientEmail: reminder.recipient_email,
        recipientPhone: reminder.recipient_phone,
      };

      const notificationTypes = reminder.notification_types || [];
      
      // Send notifications based on settings
      const promises = [];
      
      if (notificationTypes.includes('email') && payload.recipientEmail) {
        promises.push(sendEmailNotification(payload));
      }
      
      if (notificationTypes.includes('whatsapp') && payload.recipientPhone) {
        promises.push(sendWhatsAppNotification(payload));
      }
      
      if (notificationTypes.includes('push')) {
        promises.push(sendPushNotification(payload));
      }

      // Wait for all notifications to send
      await Promise.all(promises);

      // Mark reminder as sent
      await supabase.rpc('mark_reminder_sent', {
        reminder_uuid: reminder.reminder_id,
      });
    }

    console.log('Reminder processing complete');
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
}
