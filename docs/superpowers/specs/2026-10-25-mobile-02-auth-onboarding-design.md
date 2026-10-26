# M2 · Sign-in, onboarding, invites, organization switcher — spec

Date: 2026-10-25 · Branch: `feat/m2-auth-onboarding` · Status: **awaiting OK** · Version: 0.2.0 · Revised 2026-10-25: email + password and invite codes (backend B2 §Authentication)

## Problem

A beekeeper installs the APK, creates an account with email + password, creates their organization, and from then on stays signed in for months, including weeks without signal. A reviewer creates their own account the same way and joins an owner's organization with the invite code the owner sent them (WhatsApp). No email is ever sent: the project has no domain to send from. A person in several organizations switches between them.

Since A6/A7 there is a second path: the platform admin creates the account in the panel (a beekeeper with their farm as `owner`, or a reviewer already inside a farm) and hands over email + password. That person only uses **Ya tengo cuenta** and lands straight in their organization. The admin can also reset a password, change roles, remove someone from a farm and deactivate an account; the app learns all of it through `my_memberships()` and Auth errors, never through admin endpoints.

## Decisions

### Supabase client

- `src/lib/supabase.ts`: `createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { storage: LargeSecureStore, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })`.
- **LargeSecureStore** (pattern from the Supabase React Native docs): a random AES-256 key lives in `expo-secure-store`; the session JSON is encrypted with it and stored in AsyncStorage. Reason: SecureStore values are size-limited and a Supabase session can exceed the limit.
- `AppState` listener: `startAutoRefresh()` when active, `stopAutoRefresh()` in background.
- Offline: an expired access token is not a sign-out. The app keeps working on local data; the sync engine (M3) refreshes the session when the network returns. Only an explicit refresh failure with `invalid_grant`/`refresh_token_not_found`/`session_not_found`/`user_banned` asks to sign in again, and local data with pending outbox rows is **kept** until the user signs in again with the same email (different email → wipe, after a warning listing the pending count). `user_banned` (account deactivated by the admin, A7) shows "Esta cuenta está desactivada. Habla con quien administra Landak Apiario." on that screen; the pending rows stay on the phone in case the account is reactivated.
- A password reset by the admin does not end open sessions (A7): the phone keeps working until its refresh token is revoked or expires; the next sign-in uses the new password.

### Sign-up and sign-in (backend B2)

1. `(auth)/welcome`: two 56-dp buttons, **Crear cuenta** (primary) and **Ya tengo cuenta**.
2. `(auth)/sign-up`: "Tu correo" (`keyboardType="email-address"`, `autoComplete="email"`, `autoCapitalize="none"`), "Contraseña" (`secureTextEntry`, `autoComplete="new-password"`, show/hide `eye` toggle, hint "Mínimo 8 caracteres"), "Repite la contraseña" (must match, checked before sending) → `auth.signUp({ email, password })` → session at once (no confirmation email).
3. `(auth)/sign-in`: email + password (`autoComplete="current-password"`) → `auth.signInWithPassword({ email, password })`. Link "¿Olvidaste tu contraseña?" opens a sheet: "Pide a tu administrador que restablezca tu contraseña." (exact copy from `api.md` → Auth; no self-service recovery until a domain exists).
4. After either: `rpc('my_memberships')`. No membership → `(auth)/onboarding`; one → that organization becomes active; several → the last used one (stored in SecureStore as `active_organization_id`), else `organizations` modal.
5. The email is saved (not the password) so "Ya tengo cuenta" prefills it after a sign-out.

Sign-in requires network; the screen says so when offline ("Necesitas conexión para entrar la primera vez.").

### Onboarding

`(auth)/onboarding` offers two big choices: **Crear mi finca** (I am the beekeeper) and **Tengo un código** (someone invited me).

**Tengo un código** → `(auth)/join`: one field, 8 characters shown as `XXXX-XXXX` (`autoCapitalize="characters"`, `autoCorrect={false}`, 28-sp monospace, paste supported, dash inserted automatically; lowercase, spaces, O/0 and I/L mix-ups are accepted by the server) → `rpc('accept_invite', { p_code })` → returned organization becomes active → Inicio. The same screen is reachable later from the organizations modal ("Unirme con un código") for a second organization.

**Crear mi finca** → title "Crea tu finca", hint "Es el nombre de tu explotación apícola. Podrás invitar revisores después.", field "Nombre" (prefilled "Finca de <display name or email prefix>"), optional "Tu nombre" (→ `profiles.display_name`). Submit → `rpc('create_organization', { p_id: uuid(), p_name })`. The client id is generated once and kept in component state, so a retry after a timeout reuses it (the RPC is idempotent for the same owner). Then → Apiarios tab with the empty state "Crea tu primer apiario" (M4).

### Organization switcher

- `organizations` modal from Perfil (and automatically when no active org): list from the local copy of `my_memberships` (name, role badge `Propietario` / `Revisor`), "Crear otra finca" → onboarding.
- The active organization scopes every local query (M3 stores all memberships' data; screens filter by `organization_id`).
- The role of the active organization drives the UI (`useRole()` → `'owner' | 'reviewer'`).

### Perfil tab

Email, editable "Tu nombre" (`update profiles set display_name` on own row; online only in V1, shows "Necesitas conexión" otherwise), active organization + role + "Cambiar", "Personas" (M11, owners only), app version, "Cerrar sesión".

### Sign-out

Confirm sheet (outside field mode, so a dialog is allowed): if the outbox has pending rows, "Tienes N registros sin sincronizar. Si cierras sesión se perderán." with "Sincronizar primero" (primary) and "Cerrar sesión igual" (danger). Then `auth.signOut()`, wipe the SQLite database and the photo cache directory (M3/M9 register their wipe functions in `src/lib/wipe.ts`), clear `active_organization_id`.

### Errors (RPC `detail` → Spanish; Auth error codes → Spanish)

| Source | Code | Message |
|--------|------|---------|
| Auth | `invalid_credentials` | "Correo o contraseña incorrectos." |
| Auth | `user_already_exists` / `email_exists` | "Ya existe una cuenta con ese correo. Ingresa con tu contraseña." (button switches to sign-in with the email prefilled) |
| Auth | `weak_password` | "La contraseña debe tener al menos 8 caracteres." |
| Auth | `validation_failed` | "Revisa el correo y la contraseña." |
| Auth | rate limit (`over_request_rate_limit`, 429) | "Demasiados intentos. Espera un minuto." |
| Auth | `user_banned` (A7) | "Esta cuenta está desactivada." |
| Auth | network | "No hay conexión. Revisa tu internet e inténtalo de nuevo." |
| RPC | `invalid_code` | "El código no es válido, ya se usó o venció. Pide uno nuevo al propietario." |
| RPC | `invalid_name` | "Escribe un nombre de 1 a 120 caracteres." |
| RPC | `id_taken` | regenerate id and retry once, silently |
| RPC | `invalid_id` | client bug: logged, generic message |
| RPC | `not_signed_in` | back to sign-in |

`src/lib/errors.ts`: `messageFor(error: unknown): string` reading `details` first (`P0001`: the server's Spanish `message` is shown as is when the detail has no app-side override), then the `23505` constraint table and `23514` / `42501` rows of `api.md` → Errors, then the Auth code, then a generic "Algo salió mal. Inténtalo de nuevo."; shared by every later module. `42501` (RLS refused the write) → "No tienes permiso para este cambio. Pide al propietario que lo haga."

## Field use

Sign-up happens at home or next to the owner; the code screen must work with one thumb: big monospace characters, paste from WhatsApp, the dash inserted automatically, submit enabled at 8 characters. After sign-in the field is never blocked by auth: no session expiry prompt while offline.

## Security constraints

- Only the publishable key in the app. Session encrypted at rest (LargeSecureStore).
- Wipe on sign-out covers SQLite, photo files, SecureStore keys except the device's AES key, which is rotated.
- The role in the UI is convenience; RLS decides (B2).

## Backend contract used (B2)

`auth.signUp`, `auth.signInWithPassword`; RPCs `accept_invite(p_code text) returns uuid`, `my_memberships() returns table (organization_id, organization_name, role)`, `create_organization(p_id uuid, p_name text) returns uuid`; `profiles` own-row update of `display_name`; error details `invalid_id`, `invalid_name`, `id_taken`, `invalid_code`, `not_signed_in`; Auth error codes in `../beekeeper/docs/api.md` → Auth plus `user_banned` (A7 → "Impact on the mobile contract"). Accounts created by the admin (`admin-create-user`, A6) need nothing from the app.

## Out of scope

Google sign-in, password recovery by email (needs a domain), account deletion, member management (M11), offline display name edits.
