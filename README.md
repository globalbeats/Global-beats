# GlobalBeat Public App

A polished, deployment-ready music platform starter built with Next.js, Supabase PostgreSQL, Vercel, OpenAI and Stripe.

## Included

- Professional responsive web/PWA interface
- Adaptive colors and surfaces based on the listener's activity
- AI vibe endpoint with a fast local fallback
- Free and Premium product states
- Stripe subscription checkout endpoint
- Supabase email/password authentication
- PostgreSQL schema for listeners, artists, tracks, territories, playlists, reviews and listening activity
- Row Level Security policies
- Private audio and rights-document storage architecture
- Artist/admin approval screen starter
- Demo WAV tracks, so playback works immediately

## 1. Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The UI and local vibe matching work without external keys. Add keys to enable Supabase, OpenAI and Stripe.

## 2. Set up Supabase SQL

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. In Project Settings > API, copy the project URL and publishable/anon key.
5. Add them to `.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code.

To make your first administrator, create an account and run:

```sql
update public.profiles set role = 'admin' where id = 'USER_UUID';
```

## 3. Enable AI vibe matching

Add a server-side OpenAI key:

```env
OPENAI_API_KEY=...
```

The route is `app/api/ai-vibe/route.ts`. The app automatically falls back to deterministic local matching if the AI service is unavailable, so the response remains fast and the interface does not break.

For production, replace the demo catalogue import with approved tracks queried from Supabase. Keep the model output limited to track IDs that already exist in your licensed catalogue.

## 4. Enable paid Premium

Create a recurring product and price in Stripe, then add:

```env
STRIPE_SECRET_KEY=...
STRIPE_PREMIUM_PRICE_ID=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

The checkout endpoint is ready. Before launch, add a Stripe webhook route that verifies signatures and updates `profiles.plan` and `profiles.subscription_status` after subscription events. Do not trust a client-side Premium switch for real access control.

## 5. Upload to GitHub

Create a new repository named `globalbeat`, then upload this entire folder. From a computer you can also run:

```bash
git init
git add .
git commit -m "Initial GlobalBeat public app"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Do not commit `.env.local`.

## 6. Deploy on Vercel

1. In Vercel, choose **Add New > Project**.
2. Import the GitHub repository.
3. Add every variable from `.env.example` under Project Settings > Environment Variables.
4. Deploy.
5. Add your custom domain when ready.

Every push to the main branch can automatically create a new production deployment. Pull requests can use preview deployments.

## Production checklist

- Obtain music recording and publishing rights for each territory.
- Replace demo audio with licensed artist uploads.
- Add country detection plus territory checks before creating signed audio URLs.
- Add Stripe webhook verification and server-side entitlement checks.
- Protect `/admin` on the server using the profile role.
- Add abuse reporting, copyright takedown, privacy policy and terms.
- Add email verification, rate limiting, CAPTCHA and audit logs.
- Add proper PWA icons and native wrappers only after the web release is stable.
- Do not market “all songs worldwide” unless every track is licensed for every claimed region.

## Important legal boundary

This code provides the technology. It does not grant rights to commercial music. Only approved, owned, royalty-free or properly licensed tracks should be made publicly available.
