import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { credentials, tweet } = await req.json();

    console.log('Posting tweet:', tweet.text);
    console.log('Using bearer token:', credentials.bearer_token.substring(0, 20) + '...');

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.bearer_token}`,
      },
      body: JSON.stringify({ text: tweet.text }),
    });

    const responseText = await response.text();
    console.log('Twitter API response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`Twitter API ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    return new Response(JSON.stringify(data.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
