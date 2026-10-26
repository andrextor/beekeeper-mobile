# M2 · Sign-in and onboarding — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-02-auth-onboarding-design.md` · Branch: `feat/m2-auth-onboarding` · Status: **awaiting OK**

New dependencies (approval asked here): `@supabase/supabase-js`, `expo-secure-store`, `@react-native-async-storage/async-storage`, `expo-crypto` (random bytes + UUIDs), `aes-js` (as in the Supabase docs' LargeSecureStore), `react-native-get-random-values` if `supabase-js` needs it on the chosen SDK.

1. **Supabase client** — `src/lib/large-secure-store.ts` (+ `large-secure-store.test.ts` with mocked stores: round trip, missing key → null), `src/lib/supabase.ts`, `src/lib/ids.ts` (`uuid()` from `expo-crypto`), `src/db/supabase.types.ts` generated from `beekeeper` (`pnpm types` there), `.env` from `.env.example` pointing at the local stack (`http://<Mac LAN IP>:54321`).
2. **Errors** — `src/lib/errors.ts` + `errors.test.ts` (every code in the spec's table, `user_banned`, the `23505` constraint table, `23514`, `42501`, unknown `P0001` detail → server message).
3. **Session state** — `src/features/auth/session.ts` (subscribe to `onAuthStateChange`, AppState auto-refresh), `useSession()`, `useRole()`, `src/features/auth/memberships.ts` (call RPCs, store memberships + `active_organization_id`).
4. **Screens** — `src/app/(auth)/_layout.tsx`, `welcome.tsx`, `sign-up.tsx`, `sign-in.tsx`, `onboarding.tsx`, `join.tsx` (+ `src/features/auth/invite-code.ts` formatting with `invite-code.test.ts`); root `_layout.tsx` redirect (no session → sign-in; session without org → onboarding).
5. **Switcher and Perfil** — `src/app/organizations.tsx` (modal), `src/app/(tabs)/profile.tsx`.
6. **Sign-out and wipe** — `src/lib/wipe.ts` (registry of wipe functions, M3/M9 add theirs), sign-out sheet with the pending-rows warning (pending count stub returns 0 until M3).
7. **Release** — `chore(release): 0.2.0`. Check: `pnpm ci:check`.

## How Iván tests it

Backend: `beekeeper` local stack running (`pnpm db:reset` there); phone on the same Wi-Fi.

1. Crear cuenta with `nuevo1@landak.test` and a 7-character password → "La contraseña debe tener al menos 8 caracteres."; with `colmenas-123` → onboarding → Crear mi finca → "Mi finca" created → Apiarios tab empty.
2. Close the app fully, reopen → still signed in, straight to the app.
3. Airplane mode, reopen → app opens normally (no sign-in prompt).
4. Sign out → Ya tengo cuenta → `reviewer@landak.test` / `landak-2026` → lands in "Finca Landak", Perfil shows "Revisor". Wrong password → "Correo o contraseña incorrectos.".
5. In `beekeeper` Studio's SQL editor, impersonating the owner (`api.md` → Local development):
   ```sql
   begin;
   select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);
   set local role authenticated;
   select * from create_invite('00000000-0000-4000-b000-000000000001', 'reviewer');
   commit;
   ```
   → in the app as `nuevo1`: organizations → Unirme con un código → type it in lowercase → the switcher lists both organizations.
6. The same code again → "El código no es válido, ya se usó o venció…".
7. Crear cuenta with `owner@landak.test` → "Ya existe una cuenta con ese correo…" and the sign-in form opens with the email filled in.
8. Admin panel (`pnpm --filter admin dev` in `beekeeper`, as `admin@landak.test`) → Usuarios → create a beekeeper `nuevo2@landak.test` with farm "Finca Nueva" → on the phone, Ya tengo cuenta with that email and password → lands in "Finca Nueva" as Propietario, no onboarding.
9. Once A7 is merged: Admin → `nuevo2` → Desactivar → on the phone sign out and sign in again → "Esta cuenta está desactivada."; Reactivar → sign-in works.
