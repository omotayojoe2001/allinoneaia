import { supabase } from './supabase';

interface TweetData {
  text: string;
  media?: File[];
}

const DEFAULT_CREDENTIALS = {
  consumer_key: import.meta.env.VITE_TWITTER_CONSUMER_KEY || '',
  consumer_secret: import.meta.env.VITE_TWITTER_CONSUMER_SECRET || '',
  bearer_token: import.meta.env.VITE_TWITTER_BEARER_TOKEN || ''
};

export const twitterAPI = {
  async postTweet(tweet: TweetData): Promise<string> {
    const { data, error } = await supabase.functions.invoke('twitter-post', {
      body: { credentials: DEFAULT_CREDENTIALS, tweet }
    });

    if (error) throw error;
    return data.id;
  },

  async uploadMedia(file: File): Promise<string> {
    const { data, error } = await supabase.storage
      .from('tweet-media')
      .upload(`${Date.now()}-${file.name}`, file);

    if (error) throw error;
    return data.path;
  }
};
