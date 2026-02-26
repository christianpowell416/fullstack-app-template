/**
 * AI Proxy Edge Function
 *
 * Routes all AI calls through the server to keep API keys secure.
 * The mobile app sends requests here with a JWT token; this function
 * verifies the token and forwards the request to the AI provider.
 *
 * Actions:
 * - openai-chat: GPT-4o-mini text chat
 * - gemini-image-gen: Gemini image generation
 *
 * Add more actions as needed (transcription, TTS, embeddings, etc.)
 *
 * Deploy: supabase functions deploy ai-proxy
 * Secrets: supabase secrets set OPENAI_API_KEY=sk-... GEMINI_API_KEY=AI...
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Auth: Verify the user's JWT ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    // --- Parse request ---
    const body = await req.json()
    const { action, ...params } = body

    // --- Optional: Log usage to database ---
    // const serviceClient = createClient(
    //   Deno.env.get('SUPABASE_URL')!,
    //   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    // )
    // await serviceClient.rpc('increment_usage', {
    //   p_user_id: user.id,
    //   p_operation: action === 'gemini-image-gen' ? 'image_generation' : 'ai_request',
    //   p_cost_usd: 0, // Calculate based on model/tokens
    // })

    // --- Route to AI provider ---
    switch (action) {
      case 'openai-chat':
        return await handleOpenAIChat(params)
      case 'gemini-image-gen':
        return await handleGeminiImageGen(params)
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }

  } catch (error) {
    console.error('[ai-proxy] Error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})

// =============================================================================
// OpenAI Chat
// =============================================================================
async function handleOpenAIChat(params: any) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return jsonResponse({ error: 'OpenAI API key not configured' }, 500)
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model || 'gpt-4o-mini',
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('[ai-proxy] OpenAI error:', error)
    return jsonResponse({ error: 'OpenAI request failed' }, response.status)
  }

  const data = await response.json()
  return jsonResponse(data)
}

// =============================================================================
// Gemini Image Generation
// =============================================================================
async function handleGeminiImageGen(params: any) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return jsonResponse({ error: 'Gemini API key not configured' }, 500)
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: params.prompt }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('[ai-proxy] Gemini error:', error)
    return jsonResponse({ error: 'Gemini request failed' }, response.status)
  }

  const data = await response.json()
  return jsonResponse(data)
}
