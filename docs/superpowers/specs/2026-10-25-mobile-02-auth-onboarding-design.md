# M2 · Sign-in, onboarding, invites, organization switcher — spec

Date: 2026-10-25 · Branch: `feat/m2-auth-onboarding` · Status: **awaiting OK** · Version: 0.2.0

## Problem

A beekeeper installs the APK, signs in with nothing but an email, creates their organization, and from then on stays signed in for months, including weeks without signal. A reviewer invited by an owner signs in with the invited email and lands directly in that organization. A person in several organizations switches between them.

## Decisions

### Supabase client

- `src/lib/supabase.ts`: `createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { storage: LargeSecureStore, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })`.
- **LargeSecureStore** (pattern from the Supabase React Native docs): a random AES-256 key lives in `expo-secure-store`; the session JSON is encrypted with it and stored in AsyncStorage. Reason: SecureStore values are size-limited and a Supabase session can exceed the limit.
- `AppState` listener: `startAutoRefresh()` when active, `stopAutoRefresh()` in background.
- Offline: an expired access token is not a sign-out. The app keeps working on local data; the sync engine (M3) refreshes the session when the network returns. Only an explicit refresh failure with `invalid_grant`/`refresh_token_not_found` asks to sign in again, and local data with pending outbox rows is **kept** until the user signs in again with the same email (different email → wipe, after a warning listing the pending count).

### Sign-in flow (backend B2)

1. `(auth)/sign-in`: "Tu correo" (`keyboardType="email-address"`, `autoComplete="email"`), "Enviar código" → `auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`.
2. `(auth)/code`: one 6-digit field (`keyboardType="number-pad"`, `textContentType="oneTimeCode"`, `autoComplete="sms-otp"`), 32-sp digits, "Reenviar código" after 60 s, "Cambiar correo" → `auth.verifyOtp({ email, token, type: 'email' })`.
3. After verify: `rpc('accept_my_invites')` → `rpc('my_memberships')`.
4. No membership → `(auth)/onboarding`; one → that organization becomes active; several → the last used one (stored in SecureStore as `active_organization_id`), else `organizations` modal.

Sign-in requires network; the screen says so when offline ("Necesitas conexión para entrar la primera vez.").

### Onboarding

`(auth)/onboarding`: title "Crea tu organización", hint "Es el nombre de tu explotación apícola. Podrás invitar revisores después.", field "Nombre" (prefilled "Apiario de <display name or email prefix>"), optional "Tu nombre" (→ `profiles.display_name`). Submit → `rpc('create_organization', { p_id: uuid(), p_name })`. The client id is generated once and kept in component state, so a retry after a timeout reuses it (the RPC is idempotent for the same owner). Then → Apiarios tab with the empty state "Crea tu primer apiario" (M4).

### Organization switcher

- `organizations` modal from Perfil (and automatically when no active org): list from the local copy of `my_memberships` (name, role badge `Propietario` / `Revisor`), "Crear otra organización" → onboarding.
- The active organization scopes every local query (M3 stores all memberships' data; screens filter by `organization_id`).
- The role of the active organization drives the UI (`useRole()` → `'owner' | 'reviewer'`).

### Perfil tab

Email, editable "Tu nombre" (`update profiles set display_name` on own row; online only in V1, shows "Necesitas conexión" otherwise), active organization + role + "Cambiar", "Personas" (M11, owners only), app version, "Cerrar sesión".

### Sign-out

Confirm sheet (outside field mode, so a dialog is allowed): if the outbox has pending rows, "Tienes N registros sin sincronizar. Si cierras sesión se perderán." with "Sincronizar primero" (primary) and "Cerrar sesión igual" (danger). Then `auth.signOut()`, wipe the SQLite database and the photo cache directory (M3/M9 register their wipe functions in `src/lib/wipe.ts`), clear `active_organization_id`.

### Errors (RPC `detail` → Spanish; Auth error codes → Spanish)

| Source | Code | Message |
|--------|------|---------|
| Auth | rate limit (429) | "Demasiados intentos. Espera un minuto." |
| Auth | `otp_expired` / invalid token | "El código no es válido o ya venció. Pide uno nuevo." |
| Auth | network | "No hay conexión. Revisa tu internet." |
| RPC | `invalid_name` | "Escribe un nombre de 1 a 120 caracteres." |
| RPC | `id_taken` | regenerate id and retry once, silently |
| RPC | `email_not_confirmed` | "Confirma tu correo para aceptar invitaciones." |
| RPC | `not_signed_in` | back to sign-in |

`src/lib/errors.ts`: `messageFor(error: unknown): string` reading `detail` first, then the Auth code, then a generic "Algo salió mal. Inténtalo de nuevo."; shared by every later module.

## Field use

Sign-in happens at home, but the code screen must work with one thumb: big digits, paste from the email app, auto-submit at 6 digits. After sign-in the field is never blocked by auth: no session expiry prompt while offline.

## Security constraints

- Only the publishable key in the app. Session encrypted at rest (LargeSecureStore).
- Wipe on sign-out covers SQLite, photo files, SecureStore keys except the device's AES key, which is rotated.
- The role in the UI is convenience; RLS decides (B2).

## Backend contract used (B2)

`auth.signInWithOtp`, `auth.verifyOtp(type 'email')`; RPCs `accept_my_invites() returns setof uuid`, `my_memberships() returns table (organization_id, organization_name, role)`, `create_organization(p_id uuid, p_name text) returns uuid`; `profiles` own-row update of `display_name`; error details `invalid_name`, `id_taken`, `email_not_confirmed`, `not_signed_in`.

## Out of scope

Google sign-in, account deletion, member management (M11), offline display name edits.
