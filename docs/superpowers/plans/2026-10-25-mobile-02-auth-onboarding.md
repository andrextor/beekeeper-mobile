# M2 · Sign-in and onboarding — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-02-auth-onboarding-design.md` · Branch: `feat/m2-auth-onboarding` · Status: **awaiting OK**

New dependencies (approval asked here): `@supabase/supabase-js`, `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-crypto` (random bytes + UUIDs), `aes-js` (as in the Supabase docs' LargeSecureStore), `react-native-get-random-values` if `supabase-js` needs it on the chosen SDK.

1. **Supabase client** — `src/lib/large-secure-store.ts` (+ `large-secure-store.test.ts` with mocked stores: round trip, missing key → null), `src/lib/supabase.ts`, `src/lib/ids.ts` (`uuid()` from `expo-crypto`), `src/db/supabase.types.ts` generated from `beekeeper` (`pnpm types` there), `.env` from `.env.example` pointing at the local stack (`http://<Mac LAN IP>:54321`).
2. **Errors** — `src/lib/errors.ts` + `errors.test.ts` (every code in the spec's table).
3. **Session state** — `src/features/auth/session.ts` (subscribe to `onAuthStateChange`, AppState auto-refresh), `useSession()`, `useRole()`, `src/features/auth/memberships.ts` (call RPCs, store memberships + `active_organization_id`).
4. **Screens** — `src/app/(auth)/_layout.tsx`, `sign-in.tsx`, `code.tsx`, `onboarding.tsx`; root `_layout.tsx` redirect (no session → sign-in; session without org → onboarding).
5. **Switcher and Perfil** — `src/app/organizations.tsx` (modal), `src/app/(tabs)/profile.tsx`.
6. **Sign-out and wipe** — `src/lib/wipe.ts` (registry of wipe functions, M3/M9 add theirs), sign-out sheet with the pending-rows warning (pending count stub returns 0 until M3).
7. **Release** — `chore(release): 0.2.0`. Check: `pnpm ci:check`.

## How Iván tests it

Backend: `beekeeper` local stack running (`pnpm db:reset` there); phone on the same Wi-Fi.

1. Sign in with a new email `nuevo1@landak.test` → code in Mailpit (http://localhost:54324) → onboarding → "Mi apiario" created → Apiarios tab empty.
2. Close the app fully, reopen → still signed in, straight to the app.
3. Airplane mode, reopen → app opens normally (no sign-in prompt).
4. Sign out → sign in as `reviewer@landak.test` → lands in "Finca Landak", Perfil shows "Revisor".
5. From `beekeeper` as owner, invite `nuevo1@landak.test` to Finca Landak → in the app sign out/in as `nuevo1` → the switcher lists both organizations.
6. Wrong code → "El código no es válido…"; request three codes fast → rate-limit message.
