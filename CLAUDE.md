# Claude Code Project Instructions

This file contains project-specific instructions for Claude Code when working on this codebase.

# Notification sound when a task completes or when you have a question:
# macOS:   afplay /System/Library/Sounds/Glass.aiff
# Windows: powershell.exe -c "[console]::beep(800,200)"

---

## Project Architecture

### Tech Stack
- **Mobile App**: Expo (React Native) with Expo Router
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Web Admin**: Next.js (App Router) deployed on Vercel
- **AI Services**: OpenAI (text), Gemini (images) — proxied through Edge Functions
- **Payments**: RevenueCat (in-app subscriptions)
- **Email**: Resend (transactional + marketing)

### Key Directories
- `app/` — Expo Router pages and layouts (mobile)
- `lib/` — Core services (AI clients, database, utilities)
- `components/` — Reusable React Native components
- `website/` — Next.js admin site (separate package.json)
- `supabase/functions/` — Deno Edge Functions
- `supabase/migrations/` — SQL migration files
- `docs/` — Project documentation

<!--
### AI Agent System (fill in if applicable)
- **Agent A**: [Model] — [Purpose] — `app/(tabs)/session.tsx` line ~XX
- **Agent B**: [Model] — [Purpose] — `lib/analyst.ts` line ~XX
- **Image Gen**: [Model] — `lib/imagen.ts` line ~XX
-->

---

## AI Prompts Documentation

**IMPORTANT:** When modifying any AI agent prompts, also update the documentation.

### Prompt Locations
| Component | File | Line |
|-----------|------|------|
| Agent A | `app/(tabs)/session.tsx` | ~XXX |
| Agent B | `lib/analyst.ts` | ~XXX |
| Image Prompt | `lib/imagen.ts` | ~XXX |

### Documentation Location
All AI prompts are documented in: `docs/AI_AGENT_PROMPTS.md`

### When to Update Documentation
Update `docs/AI_AGENT_PROMPTS.md` whenever you:
- Modify any system prompt
- Add a new AI agent or prompt
- Change the response format/schema for any agent

---

## Git & GitHub

Push commits to GitHub on a semi-regular basis:
- After completing a significant feature or fix
- Before ending a session with multiple uncommitted changes
- When the user requests a commit/push
- Approximately every 3-5 meaningful changes

Use descriptive commit messages that summarize what was changed and why.

---

## Website Deployment (Vercel)

When deploying changes to the website (`website/` directory):

1. Build locally first to catch errors: `cd website && npm run build`
2. Deploy to production: `vercel --prod`
3. **ALWAYS check the Vercel logs after deployment:**
   ```
   vercel inspect <deployment-url> --logs
   ```
4. Verify the build completed successfully
5. Check for any errors or warnings in the build output

Never assume a deployment succeeded without checking the logs.

---

## Mobile Deployment (EAS)

### Build Profiles
```bash
# Development (includes dev tools, simulator)
eas build --platform ios --profile development

# Preview (TestFlight / internal testing)
eas build --platform ios --profile preview

# Production (App Store / Play Store)
eas build --platform ios --profile production
eas build --platform android --profile production
```

### OTA Updates (JS-only changes, no native code changes)
```bash
eas update --branch production --message "Description of changes"
```

---

## Expo Go vs Development Build (IMPORTANT)

This app supports **both Expo Go and custom development builds**. Some native modules only work in dev builds.

### Native Modules System

All native-only modules are managed through `lib/native-modules.ts`. This file:
- Detects Expo Go using `Constants.appOwnership === 'expo'`
- Exports `null` for unavailable modules in Expo Go
- Provides fallback-friendly exports

### When Adding New Native Modules

**CRITICAL:** Before importing any `react-native-*` package (not part of Expo SDK), check if it requires native code:

1. **If native-only:** Add it to `lib/native-modules.ts` with safe loading + fallback
2. **If Expo-compatible** (like `react-native-reanimated`, `react-native-gesture-handler`): Import directly

### Example
```typescript
import { RNShare, isExpoGo } from '@/lib/native-modules';

if (RNShare) {
  await RNShare.shareSingle({...});
} else {
  Alert.alert('Not Available', 'This feature requires a development build.');
}
```

---

## Supabase Edge Functions

### Key Notes
- Edge Functions run **Deno**, not Node.js
- Imports use `jsr:` or `npm:` specifiers, not bare `import` from `node_modules`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected
- Custom secrets must be set with `supabase secrets set KEY=value`

### The AI Proxy Pattern
All AI API calls from the mobile app go through `supabase/functions/ai-proxy/index.ts`:
- Verifies the user's JWT token
- Routes to the correct AI provider based on `action` field
- Logs usage and costs to the database
- Enforces rate limits and daily usage limits
- API keys (OpenAI, Gemini) never leave the server

### Deploying Functions
```bash
supabase functions deploy ai-proxy
supabase functions deploy generate-images
# etc.
```

---

## TypeScript Notes

<!-- If you have pre-existing type issues, note them here so Claude doesn't waste time fixing them -->
<!-- Example: This project has some pre-existing Supabase type issues (types resolve to `never`). -->
<!-- These are known issues and don't affect runtime behavior. Focus on actual logic errors. -->

---

## Testing Changes

When making changes to AI-related code:
1. Test the conversation flow in the session screen
2. Verify goals/data are extracted correctly
3. Check that images generate with proper styling
4. Confirm duplicate prevention works

When making changes to the admin website:
1. Build locally: `cd website && npm run build`
2. Test the affected pages in dev mode
3. Deploy and check Vercel logs
