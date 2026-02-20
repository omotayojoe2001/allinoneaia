import { supabase } from './supabase';

interface VoicemakerOptions {
  voiceId?: string;
  languageCode?: string;
  outputFormat?: string;
  sampleRate?: string;
  effect?: string;
}

export const voicemakerAPI = {
  async getApiKey(): Promise<string> {
    const { data } = await supabase
      .from('api_config')
      .select('api_key')
      .eq('service', 'voicemaker')
      .single();
    
    return data?.api_key || '';
  },

  async generateVoice(text: string, options: VoicemakerOptions = {}): Promise<string> {
    const apiKey = await this.getApiKey();
    
    const response = await fetch('https://developer.voicemaker.in/api/v1/voice/convert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        VoiceId: options.voiceId || 'ai3-Jony',
        LanguageCode: options.languageCode || 'en-US',
        Text: text,
        OutputFormat: options.outputFormat || 'mp3',
        SampleRate: options.sampleRate || '48000',
        Effect: options.effect || 'default',
        MasterVolume: '0',
        MasterSpeed: '0',
        MasterPitch: '0',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voicemaker API error: ${error}`);
    }

    const data = await response.json();
    return data.path;
  },

  async listVoices(language?: string): Promise<any[]> {
    const apiKey = await this.getApiKey();
    
    const response = await fetch('https://developer.voicemaker.in/api/v1/voice/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language: language || '' }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    return data.data?.voices_list || [];
  },
};
