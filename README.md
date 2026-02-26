# Clone My Stack — Full-Stack App Template

A comprehensive guide and starter config for building a production mobile + web app using the same stack as [VSBO](https://vsbo.ai).

> **This repo is documentation + config files, not a runnable app.** Fork it, fill in placeholders, then start building your own app on top of these patterns.

---

## Tech Stack Overview

| Layer | Tool | Purpose | Why This One |
|-------|------|---------|--------------|
| **Mobile App** | [Expo](https://expo.dev) + React Native | Cross-platform iOS/Android app | Managed workflow, OTA updates, great DX |
| **Routing (Mobile)** | [Expo Router](https://docs.expo.dev/router/introduction/) | File-based navigation | Type-safe, feels like Next.js for mobile |
| **Backend** | [Supabase](https://supabase.com) | Postgres DB, Auth, Storage, Edge Functions | Open-source Firebase alternative, generous free tier |
| **Edge Functions** | Supabase Edge Functions (Deno) | Serverless API endpoints | Keep API keys server-side, co-located with DB |
| **AI — Text** | [OpenAI API](https://platform.openai.com) | Chat, analysis, transcription, TTS | Best-in-class models, great streaming support |
| **AI — Images** | [Google Gemini](https://ai.google.dev) | Image generation & editing | High quality, good pricing, native image output |
| **Web Admin** | [Next.js](https://nextjs.org) | Admin dashboard & marketing site | React SSR, API routes, easy Vercel deploy |
| **Hosting (Web)** | [Vercel](https://vercel.com) | Web deployment & cron jobs | Zero-config Next.js hosting, built-in cron |
| **Payments** | [RevenueCat](https://www.revenuecat.com) | In-app subscriptions | Handles Apple/Google receipt validation |
| **Email** | [Resend](https://resend.com) | Transactional & marketing email | Modern API, React email templates, webhooks |
| **Cost Analytics** | [BigQuery](https://cloud.google.com/bigquery) | GCP billing export analysis | Reconcile AI costs against billing data |
| **AI Dev Tool** | [Claude Code](https://claude.com/claude-code) | AI pair programmer (mandatory) | Built the entire VSBO app. Reads your full codebase, writes code, deploys, debugs. |

---

## Account Setup Checklist

### Day 1 — Must Have
- [ ] **Claude Code** — [claude.com/claude-code](https://claude.com/claude-code) — AI pair programmer. This is how the entire VSBO app was built. Install it first, use it for everything.
- [ ] **Supabase** — [supabase.com](https://supabase.com) — Create a project (free tier is fine to start)
- [ ] **Expo** — [expo.dev](https://expo.dev) — Sign up, install `eas-cli` globally
- [ ] **Vercel** — [vercel.com](https://vercel.com) — Link to your GitHub repo
- [ ] **OpenAI** — [platform.openai.com](https://platform.openai.com) — Get API key, set a spending limit
- [ ] **GitHub** — Repo for your app code

### Day 2 — When You Need Them
- [ ] **Google AI Studio** — [aistudio.google.com](https://aistudio.google.com) — Gemini API key (for image generation)
- [ ] **Resend** — [resend.com](https://resend.com) — Add your domain, verify DNS records
- [ ] **RevenueCat** — [revenuecat.com](https://www.revenuecat.com) — Set up Apple/Google app configs

### Later — Nice to Have
- [ ] **Google Cloud** — [console.cloud.google.com](https://console.cloud.google.com) — BigQuery billing export for cost tracking
- [ ] **Apple Developer** — [developer.apple.com](https://developer.apple.com) — $99/year, required for App Store
- [ ] **Google Play Developer** — [play.google.com/console](https://play.google.com/console) — $25 one-time, required for Play Store

---

## API Key Checklist

| Key | Where to Get It | Goes In | Security |
|-----|----------------|---------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `.env.local` (mobile) | Public (safe in bundle) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | `.env.local` (mobile) | Public (safe in bundle, RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | `website/.env.local`, Supabase secrets | **SECRET** — never expose client-side |
| `OPENAI_API_KEY` | OpenAI → API Keys | Supabase secrets only | **SECRET** — only in Edge Functions |
| `GEMINI_API_KEY` | Google AI Studio → Get API Key | Supabase secrets only | **SECRET** — only in Edge Functions |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | RevenueCat → Project → API Keys | `.env.local` (mobile) | Public (RevenueCat SDK key) |
| `RESEND_API_KEY` | Resend → API Keys | `website/.env.local` | **SECRET** — server-side only |
| `CRON_SECRET` | Generate yourself (`openssl rand -hex 32`) | `website/.env.local` | **SECRET** — protects cron endpoints |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as mobile Supabase URL | `website/.env.local` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as mobile anon key | `website/.env.local` | Public |
| `REVENUECAT_WEBHOOK_SECRET` | RevenueCat → Project → Webhooks | `website/.env.local` | **SECRET** — webhook verification |
| `RESEND_WEBHOOK_SECRET` | Resend → Webhooks → Signing Secret | `website/.env.local` | **SECRET** — webhook verification |

---

## Recommended Project Structure

```
your-app/
├── app/                          # Expo Router pages (mobile)
│   ├── (tabs)/                   #   Tab navigation group
│   │   ├── _layout.tsx           #     Tab bar config
│   │   ├── index.tsx             #     Home tab
│   │   └── ...                   #     Other tabs
│   ├── _layout.tsx               #   Root layout (auth checks, providers)
│   └── ...                       #   Other screens
│
├── components/                   # Reusable React Native components
│   ├── ui/                       #   Generic UI (buttons, inputs)
│   └── ...                       #   Feature-specific components
│
├── lib/                          # Core services & utilities
│   ├── supabase.ts               #   Supabase client init
│   ├── ai-client.ts              #   Calls to your AI proxy
│   ├── native-modules.ts         #   Expo Go compatibility layer
│   └── ...                       #   Other services
│
├── assets/                       # Fonts, images, static files
├── constants/                    # App-wide constants
├── hooks/                        # Custom React hooks
│
├── website/                      # Next.js admin/marketing site
│   ├── src/
│   │   ├── app/                  #   App Router pages
│   │   │   ├── admin/            #     Admin dashboard
│   │   │   ├── api/              #     API routes (cron, webhooks)
│   │   │   └── ...               #     Public pages
│   │   ├── components/           #   React components
│   │   └── lib/                  #   Server utilities
│   ├── .env.local                #   Web env vars (gitignored)
│   └── package.json              #   Separate deps from mobile
│
├── supabase/                     # Supabase project config
│   ├── functions/                #   Edge Functions (Deno)
│   │   ├── ai-proxy/index.ts     #     AI API proxy (THE key pattern)
│   │   └── .../index.ts          #     Other functions
│   ├── migrations/               #   SQL migrations
│   └── config.toml               #   Local dev config
│
├── database/                     # Schema documentation
│   └── schema.sql                #   Full schema reference
│
├── docs/                         # Project documentation
├── .env.local                    # Mobile env vars (gitignored)
├── app.json                      # Expo config
├── CLAUDE.md                     # Claude Code instructions
├── package.json                  # Mobile app dependencies
└── .gitignore                    # Ignore rules
```

---

## Local Dev Setup

### Prerequisites
- **Claude Code** (`npm install -g @anthropic-ai/claude-code`) — you'll use this for everything below
- Node.js 18+ (`node -v`)
- npm or yarn
- Supabase CLI (`npm install -g supabase`)
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)
- Vercel CLI (`npm install -g vercel`)
- Git

### 1. Clone & Install

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install mobile app dependencies
npm install

# Install website dependencies
cd website && npm install && cd ..
```

### 2. Set Up Environment Variables

```bash
# Copy example env files and fill in your keys
cp .env.example .env.local
cp website/.env.example website/.env.local
```

### 3. Set Up Supabase Locally (Optional)

```bash
# Start local Supabase (Docker required)
supabase start

# Run migrations
supabase db reset

# Generate TypeScript types from your schema
supabase gen types typescript --local > lib/database.types.ts
```

### 4. Set Supabase Edge Function Secrets

```bash
# Set secrets for deployed Edge Functions
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GEMINI_API_KEY=AI...
supabase secrets set DEV_BYPASS_KEY=your-dev-key
```

### 5. Start Development

```bash
# Terminal 1 — Mobile app
npx expo start

# Terminal 2 — Website
cd website && npm run dev

# Terminal 3 — Edge Functions (if developing locally)
supabase functions serve
```

### 6. Deploy

```bash
# Deploy website to Vercel
cd website && vercel --prod

# Deploy Edge Functions
supabase functions deploy ai-proxy
supabase functions deploy generate-images

# Push database migrations
supabase db push

# Build mobile app
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## The AI Proxy Pattern

**This is the most important architectural pattern in the stack.** Never put AI API keys in your mobile app bundle.

### How It Works

```
┌─────────────┐     JWT token      ┌───────────────────┐    API key     ┌──────────┐
│  Mobile App  │ ──────────────────▶│  Supabase Edge Fn  │ ─────────────▶│  OpenAI  │
│  (no keys)   │                    │  (ai-proxy)        │               │  Gemini  │
└─────────────┘     response       └───────────────────┘    response    └──────────┘
                 ◀──────────────────                     ◀─────────────
```

### The Edge Function (`supabase/functions/ai-proxy/index.ts`)

A single Edge Function that routes all AI calls:

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify the user's JWT
  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader! } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { action, ...params } = await req.json()

  // Route to the right AI service
  switch (action) {
    case 'openai-chat':
      return handleOpenAIChat(params, corsHeaders)
    case 'gemini-image-gen':
      return handleGeminiImageGen(params, corsHeaders)
    // ... more actions
    default:
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }
})

async function handleOpenAIChat(params: any, headers: Record<string, string>) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: params.messages,
    }),
  })
  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}
```

### Client-Side Usage (`lib/ai-client.ts`)

```typescript
import { supabase } from './supabase'

export async function aiChat(messages: Array<{ role: string; content: string }>) {
  const { data: { session } } = await supabase.auth.getSession()

  const { data, error } = await supabase.functions.invoke('ai-proxy', {
    body: {
      action: 'openai-chat',
      messages,
    },
  })

  if (error) throw error
  return data
}
```

### Why This Pattern

- **API keys never leave the server** — can't be extracted from your app bundle
- **Single endpoint** — one function handles all AI routing
- **Built-in auth** — Supabase JWT verification is automatic
- **Cost tracking** — log every request to your DB before/after the AI call
- **Rate limiting** — check user limits in the same function
- **Easy to add providers** — just add a new `case` to the switch

---

## Claude Code Workflow

> **Claude Code is not optional.** The entire VSBO app — mobile, web, backend, edge functions, migrations, email system, admin dashboard — was built with Claude Code. It's the most important tool in this stack.

[Claude Code](https://claude.com/claude-code) is an AI pair programmer that runs in your terminal and reads your entire codebase. It writes code, runs commands, deploys, debugs, and commits. You describe what you want and it builds it.

### Getting Started

```bash
# Install
npm install -g @anthropic-ai/claude-code

# Run in your project root
claude
```

### CLAUDE.md — Your Project's Brain

Create a `CLAUDE.md` in your repo root (use the template in this repo). Claude reads this at the start of every session. This is how you teach it your project's conventions, architecture, and deployment process. The more context you put here, the better Claude performs.

Include:
- Project architecture overview
- Key file locations and line numbers
- Naming conventions and patterns
- Deployment commands and verification steps
- Known quirks and things to avoid

### Tips

1. **Start with CLAUDE.md on day 1** — Even a few lines of architecture context makes a huge difference
2. **Include deployment verification** — Tell Claude to always check logs after deploying (it will actually do it)
3. **Document your AI prompts** — If your app uses AI, keep prompts documented so Claude can update them correctly
4. **Use notification sounds** — Add a beep command so you know when Claude finishes a long task (see CLAUDE.md template)
5. **Track native module patterns** — If using Expo, document which modules need special handling for Expo Go
6. **Let it commit** — Claude writes good commit messages. Let it commit and push as you go
7. **Trust it to explore** — Claude can grep, glob, read files, and understand your whole codebase. Tell it what you want, not which file to edit

---

## Deployment Guide

### Vercel (Website)

```bash
cd website
npm run build          # Always build locally first to catch errors
vercel --prod          # Deploy to production
vercel inspect <url> --logs   # ALWAYS check logs after deploy
```

**Cron jobs**: Configure in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-digest", "schedule": "0 14 * * *" },
    { "path": "/api/cron/reminders", "schedule": "*/15 * * * *" }
  ]
}
```

Protect cron endpoints with a `CRON_SECRET`:
```typescript
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... cron logic
}
```

### EAS Build (Mobile)

```bash
# Development build (includes dev tools)
eas build --platform ios --profile development

# Preview build (TestFlight / internal testing)
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# OTA update (skip full build for JS-only changes)
eas update --branch production --message "Fix typo"
```

### Supabase

```bash
# Push migrations to production
supabase db push

# Deploy a specific Edge Function
supabase functions deploy ai-proxy

# Deploy all Edge Functions
supabase functions deploy

# Set secrets
supabase secrets set KEY=value
```

---

## Best Practices

### Native Module Safety (Expo Go vs Dev Builds)

Some `react-native-*` packages require native code and won't work in Expo Go. Create a compatibility layer:

```typescript
// lib/native-modules.ts
import Constants from 'expo-constants'

export const isExpoGo = Constants.appOwnership === 'expo'

// Safely load native-only modules
export let RNShare: typeof import('react-native-share') | null = null
if (!isExpoGo) {
  try {
    RNShare = require('react-native-share').default
  } catch {
    RNShare = null
  }
}
```

Usage:
```typescript
import { RNShare, isExpoGo } from '@/lib/native-modules'

if (RNShare) {
  await RNShare.shareSingle({ /* ... */ })
} else {
  // Fallback for Expo Go
  await Share.share({ message: 'Check this out!' })
}
```

### Error Logging to Supabase

Log errors to a `client_errors` table for debugging:

```typescript
// lib/error-logger.ts
import { supabase } from './supabase'

export async function logError(error: Error, context?: Record<string, any>) {
  try {
    await supabase.from('client_errors').insert({
      message: error.message,
      stack: error.stack,
      context: context ?? {},
    })
  } catch {
    // Don't throw from the error logger
    console.error('Failed to log error:', error)
  }
}
```

### Typed Supabase Client

Generate types from your schema:

```bash
supabase gen types typescript --local > lib/database.types.ts
```

Use them everywhere:

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
```

### RevenueCat Integration

```typescript
// lib/revenuecat.ts
import Purchases from 'react-native-purchases'

export async function initRevenueCat() {
  Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
  })
}

export async function checkSubscription(): Promise<boolean> {
  const customerInfo = await Purchases.getCustomerInfo()
  return customerInfo.entitlements.active['pro'] !== undefined
}
```

Set up a webhook at `/api/webhooks/revenuecat` to sync subscription status to your database.

### Cost Tracking

Log every AI API call with estimated cost:

```sql
CREATE TABLE user_daily_usage (
  user_id       UUID NOT NULL,
  usage_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  image_count   INTEGER NOT NULL DEFAULT 0,
  ai_request_count INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);
```

Check limits before making AI calls in your proxy function.

---

## Quick Reference Commands

```bash
# Mobile
npx expo start                        # Start dev server
npx expo start --clear                # Clear cache and start
eas build --platform ios -p preview   # Build for TestFlight
eas update --branch production        # Push OTA update

# Website
cd website && npm run dev             # Start Next.js dev
cd website && vercel --prod           # Deploy to Vercel

# Supabase
supabase start                        # Start local instance
supabase db reset                     # Reset local DB
supabase db push                      # Push migrations to prod
supabase functions serve              # Serve functions locally
supabase functions deploy ai-proxy    # Deploy function
supabase gen types typescript --local # Generate TS types
supabase secrets set KEY=value        # Set function secret

# Git
git add -A && git commit -m "msg"     # Commit all
git push origin main                  # Push to remote
```

---

## Further Reading

- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Google AI (Gemini) Docs](https://ai.google.dev/docs)
- [RevenueCat Docs](https://www.revenuecat.com/docs)
- [Resend Docs](https://resend.com/docs)
- [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)

---

Built with lessons from [VSBO](https://vsbo.ai). Good luck building!
