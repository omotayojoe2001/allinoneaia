import { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const WhatsAppTest = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [timing, setTiming] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const sendImmediate = async () => {
    setSending(true);
    setResult('');
    try {
      const response = await fetch('https://gate.whapi.cloud/messages/text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_WHAPI_TOKEN || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          typing_time: 0,
          to: phone,
          body: message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Message sent! ID: ${data.id || 'success'}`);
      } else {
        const error = await response.text();
        setResult(`❌ Failed: ${error}`);
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    }
    setSending(false);
  };

  const scheduleMessage = async () => {
    setSending(true);
    setResult('');
    try {
      // Convert local datetime to UTC ISO string
      const localDate = new Date(scheduledTime);
      const utcDate = localDate.toISOString();
      
      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          user_id: user?.id,
          target_type: 'individual',
          target_phone: phone,
          send_via_whatsapp: true,
          send_via_email: false,
          message_body: message,
          scheduled_time: utcDate,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      setResult(`✅ Scheduled! Campaign ID: ${data.id}. Will send at ${localDate.toLocaleString()}`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    }
    setSending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timing === 'immediate') {
      sendImmediate();
    } else {
      scheduleMessage();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">WhatsApp Test</h1>
          <p className="text-sm text-muted-foreground">Test Whapi.cloud integration</p>
        </div>

        <div className="glass-card rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2347049163283"
                required
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +234...)</p>
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hello! This is a test message."
                required
                rows={4}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Timing</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setTiming('immediate')}
                  className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                    timing === 'immediate' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setTiming('scheduled')}
                  className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 ${
                    timing === 'scheduled' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>

            {timing === 'scheduled' && (
              <div>
                <label className="text-sm font-medium">Schedule Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current time: {new Date().toLocaleString()}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? 'Sending...' : timing === 'immediate' ? 'Send Message' : 'Schedule Message'}
            </button>
          </form>

          {result && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              result.startsWith('✅') ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {result}
            </div>
          )}
        </div>

        <div className="mt-6 glass-card rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">API Info</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>API: https://gate.whapi.cloud/</p>
            <p>Phone: +234 704 916 3283</p>
            <p>Trial: 5 days, 150 messages, 5 chats</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTest;
