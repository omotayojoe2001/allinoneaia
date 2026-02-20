import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const KCLAUT_API_KEY = "d5139b5b85d03d284e20f21ece1d2c09";
const KCLAUT_BASE_URL = "https://thekclaut.com/api/v2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()

    const formParams = new URLSearchParams()
    formParams.append('key', KCLAUT_API_KEY)
    formParams.append('action', action)

    if (params) {
      Object.keys(params).forEach(key => {
        formParams.append(key, String(params[key]))
      })
    }

    console.log('Calling KClaut API:', action, params);
    
    const response = await fetch(KCLAUT_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams.toString()
    });

    const text = await response.text();
    console.log('KClaut response:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', text);
      throw new Error('Invalid response from KClaut API');
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message, details: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
