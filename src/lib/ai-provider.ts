import { supabase } from './supabase';

interface AIProvider {
  generateText(prompt: string, options?: any): Promise<string>;
  streamText?(prompt: string, options?: any): AsyncIterator<string>;
}

class HuggingFaceProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'mistralai/Mixtral-8x7B-Instruct-v0.1') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt: string, options: any = {}): Promise<string> {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.95,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || '';
  }
}

class AIProviderManager {
  private static instance: AIProviderManager;
  private provider: AIProvider | null = null;

  private constructor() {}

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  async initialize() {
    const { data } = await supabase
      .from('api_config')
      .select('*')
      .eq('service', 'huggingface')
      .single();

    if (data) {
      this.provider = new HuggingFaceProvider(
        data.api_key,
        data.config?.model
      );
    }
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    if (!this.provider) {
      await this.initialize();
    }
    if (!this.provider) {
      throw new Error('AI provider not initialized');
    }
    return this.provider.generateText(prompt, options);
  }
}

export const aiProvider = AIProviderManager.getInstance();
