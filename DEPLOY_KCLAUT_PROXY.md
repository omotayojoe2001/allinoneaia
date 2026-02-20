# Deploy KClaut Proxy Edge Function

## Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`

## Deploy Command
```bash
supabase functions deploy kclaut-proxy --project-ref YOUR_PROJECT_REF
```

## Get Your Project Ref
1. Go to https://supabase.com/dashboard
2. Select your project
3. Copy the Project Reference ID from Settings > General

## Environment Variables
The Edge Function uses the KClaut API key hardcoded in the function.
For production, use Supabase secrets:

```bash
supabase secrets set KCLAUT_API_KEY=d5139b5b85d03d284e20f21ece1d2c09 --project-ref YOUR_PROJECT_REF
```

## Test the Function
After deployment, test it:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/kclaut-proxy \
  -H "Content-Type: application/json" \
  -d '{"action":"services"}'
```

## Update Frontend
Make sure your `.env` file has:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
```

The frontend will automatically use the proxy to call KClaut API.