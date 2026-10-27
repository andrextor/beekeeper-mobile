# M14 · Read-only role "Observador" (`viewer`) — spec

Date: 2026-10-26 · Branch: `feat/m14-viewer-role` · Status: **approved** (Iván, 2026-10-26) · Version: 1.2.0

## Problem

The backend added a third finca role, `viewer` / **Observador** (B8, `../beekeeper/docs/superpowers/specs/2026-10-26-backend-08-viewer-role-design.md`). It reads the whole finca and writes nothing. The app knows only `owner` and `reviewer`:

- `src/features/sync/members.ts` and `src/features/members/api.ts` parse roles with `z.enum(['owner', 'reviewer'])`. When `my_memberships()` or the Personas list returns `viewer`, the parse fails. The viewer sees no fincas, and an owner's Personas screen errors. **This is breaking.** The app must reach every phone before anyone gets the role in the remote Supabase.
- Every write button is shown to any non-owner. A viewer would tap Nueva revisión, save on the phone and then get `42501` on every push.

## Decisions

### 1. Roles parse, today and tomorrow

- One shared `roleSchema` in `src/features/sync/members.ts`: `z.enum(['owner', 'reviewer', 'viewer']).catch('viewer')`. `src/features/members/api.ts` imports it instead of keeping its own copy.
- **An unknown role reads as `viewer` (least privilege).** A role the backend adds later can no longer blank the app. The person sees the finca read-only until the app learns the role, and the server still decides.
- `canRecord(role)` lives next to it: `role === 'owner' || role === 'reviewer'`. This is the one place that says who writes. `useCanRecord()` in `src/features/auth/session.tsx` wraps it for screens.

### 2. Label

`roleLabels.viewer = 'Observador'` (`src/lib/labels.ts`, matching admin `labels.ts`). `RoleBadge` shows it with the neutral tone. Perfil, Fincas and Personas pick it up through `RoleBadge`.

### 3. A viewer sees no write

| Place | Owner | Reviewer | Observador |
|-------|-------|----------|------------|
| Hive: Nueva revisión / Continuar revisión (bottom bar) | ✓ | ✓ | hidden |
| Hive: draft cards | ✓ | ✓ | hidden |
| Hive: Registrar actividad | ✓ | ✓ | hidden |
| Hive: Tomar foto (no photos yet) · Fotos screen: Tomar foto | ✓ | ✓ | hidden ("Ver todas las fotos" stays) |
| Inspection detail: Editar / Borrar (with the notes inside it) | ✓ | own | hidden |
| Timeline: edit an event · Photo: Borrar | ✓ | own | hidden |
| Routes opened directly (`inspect`, `camera`, `event/new`, `event/[eventId]`) | ✓ | ✓ | `NotAvailable`: "Como observador puedes ver la finca, pero no registrar cambios." |
| Inicio: Para revisar, Tareas, Última actividad, Escanear colmena | ✓ | ✓ | ✓ (each one only opens a hive or an inspection to read) |

The "own" checks become `canRecord && (owner || mine)`. A reviewer who is changed to observador keeps no edit rights over what they wrote.

Dictation and notes live inside field mode (`inspect`), so the route guard covers them.

### 4. The outbox never takes a viewer's write

`saveRows` (`src/db/write.ts`) is the one door to the outbox. Before its transaction, it reads `members_cache.role` for each row's `organization_id`. If any is `viewer`, it throws a `42501`-shaped error and writes nothing. `messageFor` already turns that into "No tienes permiso para este cambio. Pide al propietario que lo haga."

This is a second net behind the hidden buttons, not the rule. RLS is the rule.

### 5. Invite and change role: three roles with a line each

The chips and the help text become `src/features/members/RolePicker.tsx`, because two screens use them now:

- **Propietario:** "Puede hacer todo, incluso invitar y quitar personas."
- **Revisor:** "Puede ver todo y registrar revisiones, notas, fotos y actividades. No puede cambiar apiarios ni colmenas."
- **Observador:** "Puede ver toda la finca: colmenas, revisiones, actividades, notas y fotos. No registra ni cambia nada."

Screens:

- **Invitar persona** (`src/app/invite.tsx`): the chips offer the three roles, Revisor is the default, and the help line follows the chosen chip.
- **Person sheet** (`MemberSheet`): the "Hacer revisor / Hacer propietario" toggle can't express three roles. It becomes the same chips, preselected on the current role, with the help line and a **Cambiar rol** button. The button is disabled while the chosen role equals the current one. "Quitar de la finca" and "Cerrar" stay. The server keeps the last-owner rule, and its message passes through as it does today.

### 6. Addendum (Iván, 2026-10-26, approved): WhatsApp opens directly; codes last 30 days

- **WhatsApp directly.** In `src/app/invite.tsx`, "Compartir por WhatsApp" calls `Linking.openURL('whatsapp://send?text=' + encodeURIComponent(inviteMessage(...)))`.
  - If WhatsApp is missing or `openURL` rejects, it falls back to `Share.share` with the same message, so the owner can still pick SMS, email or any other app.
  - No `canOpenURL`. On Android 11+ it needs `com.whatsapp` in `<queries>`, which is a native change (new APK). `openURL` with a catch needs no declaration, so this ships by OTA.
- **30 days.** The backend sets `expires_at` and the app already shows "Vence el …" from it, so the code needs no change. The only "7 días" for invites is in `docs/install.md`, and it becomes "30 días". The "En 7 días" chip in field mode is the next-inspection date, not invites, so it stays.

## Rejected

- **Hide by `role === 'viewer'` in each screen.** That spreads the rule over a dozen files. `canRecord` keeps it in one place.
- **Keep failing on unknown roles.** That is how this release became urgent. The safe fallback costs one `.catch`.
- **Drop "Tareas" from a viewer's Inicio** (B8's note). The rows only open a hive, so it is reading, and the observador wants to know what is pending.
- **A second door into the outbox, or a role column in the outbox.** `saveRows` is already the only door.

## Security constraints

- RLS decides. Every hidden button is a convenience, and the server returns `42501` for any viewer write, including Storage uploads.
- An unknown role falls back to the role with the least rights, never to more.
- A viewer still cannot invite or change roles, because both are owner-only (unchanged).

## Field use

- An observador standing at a hive scans its QR and lands on the hive with no write buttons. Nothing to tap by mistake with gloves on.
- Offline, an observador still reads everything already on the phone. With no writes, Pendientes stays empty.
- The role badge in Perfil says "Observador", so the person knows why the buttons are missing.

## Backend contract used

`../beekeeper/docs/api.md` → Organizations → Roles (B8, merged in `beekeeper` main, 0.17.0):

- `organization_members.role`, `my_memberships()` and the members list may return `viewer`;
- `create_invite(p_role)` and `set_member_role(p_role)` accept `viewer`;
- viewer writes to `inspections`, `hive_events`, `photos` and `hive-photos` return `42501`.

No new table, column or RPC.

## Out of scope

- **Changes made before a reviewer became observador.** These are already in the outbox; they fail with `42501` and show in Pendientes as "needs attention", where they can be discarded (M3, unchanged). Their drafts stay on the phone (hidden) until sign-out or until the role comes back.
- Reports or exports for observadores.
- Read-only links without an account: a QR never authorizes.
