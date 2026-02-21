// WhatsApp Webhook Handler for Supabase Edge Functions
// This receives incoming WhatsApp messages from Whapi.cloud and responds using AI chatbots

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Basic security: Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse incoming webhook from Whapi.cloud
    const payload = await req.json()
    console.log('Received webhook:', JSON.stringify(payload, null, 2))

    // Validate it's from Whapi.cloud (check for expected structure)
    if (!payload.messages || !Array.isArray(payload.messages)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Whapi.cloud sends messages in this format:
    // { messages: [{ from: "2347049163283", body: "Hello", ... }] }
    // OR { messages: [{ chat_id: "xxx@s.whatsapp.net", body: { text: "Hello" }, ... }] }
    const message = payload.messages?.[0]
    if (!message) {
      return new Response(JSON.stringify({ success: true, message: 'No message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Skip non-text messages (actions, status updates, etc.)
    if (message.type && message.type !== 'text') {
      console.log('Skipping non-text message type:', message.type)
      return new Response(JSON.stringify({ success: true, message: 'Not a text message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract phone number (handle different formats)
    let customerPhone = message.from || message.chat_id || 'unknown'
    // Remove @s.whatsapp.net or @g.us suffix if present
    if (customerPhone.includes('@')) {
      customerPhone = customerPhone.split('@')[0]
    }
    
    // Extract message text (handle multiple formats)
    let customerMessage = ''
    if (typeof message.body === 'string') {
      customerMessage = message.body
    } else if (message.body?.text) {
      customerMessage = message.body.text
    } else if (message.text?.body) {
      customerMessage = message.text.body
    }
    
    // If still no message, skip
    if (!customerMessage || customerMessage.trim() === '') {
      console.log('No text content found in message:', JSON.stringify(message))
      return new Response(JSON.stringify({ success: true, message: 'No text content' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const messageId = message.id
    
    console.log('Processing message from:', customerPhone, 'text:', customerMessage)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // OPTIONAL: Check if this phone number should get auto-responses
    // Uncomment this section to enable whitelist/blacklist
    /*
    const { data: phoneConfig } = await supabase
      .from('chatbot_phone_config')
      .select('*')
      .eq('phone_number', customerPhone)
      .single()
    
    // If phone is blacklisted, don't respond
    if (phoneConfig?.is_blacklisted) {
      console.log('Phone number is blacklisted:', customerPhone)
      return new Response(JSON.stringify({ success: true, message: 'Blacklisted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // If whitelist mode is enabled and phone is not whitelisted, don't respond
    const { data: settings } = await supabase
      .from('chatbot_settings')
      .select('whitelist_mode')
      .single()
    
    if (settings?.whitelist_mode && !phoneConfig?.is_whitelisted) {
      console.log('Whitelist mode enabled, phone not whitelisted:', customerPhone)
      return new Response(JSON.stringify({ success: true, message: 'Not whitelisted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    */

    // Step 1: Find which chatbot should handle this phone number
    // You can map phone numbers to chatbots in a table, or use a default chatbot
    const { data: chatbot } = await supabase
      .from('chatbots')
      .select('*')
      .eq('platform', 'whatsapp')
      .eq('is_active', true)
      .single()

    if (!chatbot) {
      console.log('No active WhatsApp chatbot found')
      return new Response(JSON.stringify({ success: true, message: 'No chatbot configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 2: Get conversation history (last 10 messages)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chatbot_id', chatbot.id)
      .eq('phone_number', customerPhone)
      .order('created_at', { ascending: false })
      .limit(10)

    // Build conversation context for AI
    const conversationHistory = (history || []).reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Step 3: Get Groq API key
    const { data: apiConfig } = await supabase
      .from('api_config')
      .select('api_key')
      .eq('service', 'groq')
      .single()

    if (!apiConfig?.api_key) {
      console.error('Groq API key not found')
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 4: Call Groq AI to generate response
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chatbot.model || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `${chatbot.instructions}\n\nKnowledge Base:\n${chatbot.knowledge_base || 'No additional knowledge provided.'}`
          },
          ...conversationHistory,
          { role: 'user', content: customerMessage }
        ],
        temperature: chatbot.temperature || 0.7,
        max_tokens: 500,
      }),
    })

    const groqData = await groqResponse.json()
    const aiResponse = groqData.choices?.[0]?.message?.content || 'Sorry, I could not process your message.'

    // Step 5: Save messages to database
    await supabase.from('chat_messages').insert([
      {
        chatbot_id: chatbot.id,
        phone_number: customerPhone,
        role: 'user',
        content: customerMessage,
        message_id: messageId
      },
      {
        chatbot_id: chatbot.id,
        phone_number: customerPhone,
        role: 'assistant',
        content: aiResponse
      }
    ])

    // Step 6: Get Whapi.cloud token and send response
    const { data: whapiConfig } = await supabase
      .from('api_config')
      .select('api_key')
      .eq('service', 'whapi')
      .single()

    if (!whapiConfig?.api_key) {
      console.error('Whapi token not found')
      return new Response(JSON.stringify({ error: 'Whapi token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send AI response back to customer via WhatsApp
    const sendResponse = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiConfig.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: customerPhone,
        body: aiResponse
      }),
    })

    const sendResult = await sendResponse.json()
    console.log('Message sent:', sendResult)

    return new Response(JSON.stringify({ success: true, response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
