import { supabase } from './supabase';

interface ElevenLabsOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export const elevenlabsAPI = {
  async getApiKey(): Promise<string> {
    const { data } = await supabase
      .from('api_config')
      .select('api_key')
      .eq('service', 'elevenlabs')
      .single();
    
    return data?.api_key || '';
  },

  async generateVoice(text: string, options: ElevenLabsOptions = {}): Promise<string> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured.');
    }

    const voiceId = options.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default: Adam voice

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: options.modelId || 'eleven_turbo_v2_5',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.75,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'API request failed' }));
      throw new Error(error.detail?.message || error.detail || 'ElevenLabs API error');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  },

  async listVoices(): Promise<any[]> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      return this.getDefaultVoices();
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });

      if (!response.ok) {
        return this.getDefaultVoices();
      }

      const data = await response.json();
      return data.voices || [];
    } catch {
      return this.getDefaultVoices();
    }
  },

  getDefaultVoices() {
    return [
      { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade' },
      { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', category: 'premade' },
      { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
      { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
      { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
      { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade' },
      { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' },
      { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', category: 'premade' },
      { voice_id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', category: 'premade' },
      { voice_id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', category: 'premade' },
    ];
  },
};
