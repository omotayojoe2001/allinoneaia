# Deploy KClaut Proxy Edge Function

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/gnqhignzuxmtpwneosax/functions

2. Click **"Create a new function"**

3. Enter function name: `kclaut-proxy`

4. Copy and paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const KCLAUT_API_KEY = "d5139b5b85d03d284e20f21ece1d2c09";
const KCLAUT_BASE_URL = "https://kclaut.com/api/v2";

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

    console.log('Calling KClaut API:', action, params)

    const response = await fetch(KCLAUT_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams.toString()
    })

    const text = await response.text()
    console.log('KClaut response:', text)
    
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: 'Invalid JSON response', raw: text }
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 200 : response.status
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

5. Click **"Deploy function"**

6. After successful deployment, update `src/lib/kclaut-api.ts`:
   - Change `const USE_PROXY = false;` to `const USE_PROXY = true;`

7. Test the Growth Services page

## Option 2: Via CLI (If you get CLI working)

```bash
# Install Supabase CLI (Windows - use Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Login
supabase login

# Link project
supabase link --project-ref gnqhignzuxmtpwneosax

# Deploy
supabase functions deploy kclaut-proxy --no-verify-jwt
```

## Testing

After deployment, the Growth Services page should load services from KClaut API automatically.

Check browser console for any errors.
