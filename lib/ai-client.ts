/**
 * AI Client - Calls your AI proxy Edge Function
 *
 * All AI API calls are routed through a Supabase Edge Function (ai-proxy)
 * so that API keys never leave the server. The mobile app only has the
 * Supabase anon key, which is safe to bundle.
 *
 * See supabase/functions/ai-proxy/index.ts for the server-side implementation.
 */

import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const DEV_BYPASS_KEY = process.env.EXPO_PUBLIC_DEV_BYPASS_KEY;

/**
 * Call the AI proxy Edge Function.
 */
async function callProxy(body: Record<string, any>): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // In dev, include bypass key for relaxed rate limits
  if (__DEV__ && DEV_BYPASS_KEY) {
    body.devBypassKey = DEV_BYPASS_KEY;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `AI proxy error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send a chat message to OpenAI via the proxy.
 */
export async function aiChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { model?: string; temperature?: number; maxTokens?: number }
) {
  return callProxy({
    action: 'openai-chat',
    messages,
    model: options?.model,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });
}

/**
 * Generate an image via the proxy (Gemini).
 */
export async function aiGenerateImage(prompt: string) {
  return callProxy({
    action: 'gemini-image-gen',
    prompt,
  });
}
