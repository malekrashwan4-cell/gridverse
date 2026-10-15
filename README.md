# Gridverse

Gridverse is a React + TypeScript collection of deterministic puzzle and brain-training games. Guests can play immediately; authenticated players can sync completed sessions, profiles, and verified leaderboard results with Supabase.

## Local setup

Copy `.env.example` to `.env` and provide the Supabase project URL and publishable key. The app also includes the connected project defaults for previews, so local guest play works without configuration.

Use the package scripts already defined in `package.json`:

- `npm run dev` starts the Vite development server.
- `npm run test` runs the deterministic gameplay tests.
- `npm run lint` checks TypeScript/React source with ESLint.
- `npm run build` creates the production bundle.

## Google sign-in setup

Google OAuth is implemented with Supabase Auth; no Google password or private OAuth secret is handled by the frontend.

1. In Google Cloud Console, create or select an OAuth 2.0 Web client.
2. Add the Supabase Auth callback URL shown in **Supabase Dashboard → Authentication → Providers → Google** as an authorized redirect URI in Google Cloud.
3. Enable the Google provider in Supabase and enter the Google client ID and client secret there.
4. In **Supabase Dashboard → Authentication → URL Configuration**, add the deployed app origin and the preview origin with `/auth/callback` as an allowed redirect URL.
5. Keep `VITE_SUPABASE_PUBLISHABLE_KEY` publishable only. Never put a service-role key or Google client secret in `.env` values exposed to Vite.

The `/auth/callback` route verifies the Supabase session before navigating into Gridverse. The existing database trigger creates a private profile row for each authenticated user and stores only the display name and avatar URL supplied by the identity provider. Completed authenticated sessions are written through the server-validated `submit_game_session` function; guest results remain device-local until a future explicit migration flow is confirmed by the player.
