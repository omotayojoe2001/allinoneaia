import { supabase } from './supabase';

interface TweetData {
  text: string;
  media?: File[];
}

const DEFAULT_CREDENTIALS = {
  consumer_key: 'qdeOeZgmiTztJ7jAQvSUqiwN6',
  consumer_secret: '78zvK9UggJMcZQ2O47Suzhcal5AF2GagWP66f8PhE7oLd2pDg9',
  bearer_token: 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
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
