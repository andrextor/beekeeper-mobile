# M11 · Members: invite reviewers, roles, leave organization — spec

Date: 2026-10-25 · Revised: 2026-10-26 (after M3–M10) · Branch: `feat/m11-members` · Status: **approved** · Version: 0.11.0

## Problem

The beekeeper (owner) wants other people — a helper, a technician, a family member — to enter the app and inspect their hives as reviewers, and to remove them later. Reviewers need to see who else is in the organization and be able to leave it.

## Decisions

### Screens (Perfil → "Personas de la finca": `src/app/members.tsx`; invite: `src/app/invite.tsx`)

| Screen | Owner | Reviewer |
|--------|-------|----------|
| Members list (email, name, role badge, "Tú", "Desactivado" badge when `profiles.deactivated_at` is set, A7) | yes, each row opens actions | yes, read-only |
| Pending invite codes (label, role, "Vence el …") | yes, "Cancelar código" | hidden (RLS does not return them) |
| "Invitar persona" button (72 dp, bottom) | yes | hidden |
| "Salir de esta finca" | yes (refused if last owner) | yes |

### Invite flow (owner)

No email is sent and the email is not verified, so access is given by a **single-use code** (backend B2 §Authentication), never by email.

1. Optional "¿Para quién es?" label (e.g. "Juan", ≤ 80, only to recognise the code in the pending list), role chips **Revisor** (default) / **Propietario** with one-line explanations:
   - Revisor: "Puede ver todo y registrar revisiones, notas, fotos y actividades. No puede cambiar apiarios ni colmenas."
   - Propietario: "Puede hacer todo, incluso invitar y quitar personas."
2. `rpc('create_invite', { p_organization_id, p_role, p_label })` → `{ invite_id, code, expires_at }`. The plain code exists only in this response: the success view is the only place it is shown (it is not stored on the phone).
3. Success view: the code in large monospace (`K7M2-9QXA`, selectable text), "Vence el 2 nov 2026 · sirve una sola vez", **"Compartir por WhatsApp"** (72 dp) → React Native `Share.share` with:
   "Te invité a <finca> en Landak Apiario. Instala la app, crea tu cuenta y escribe este código: K7M2-9QXA. Vence el 2 nov 2026."
   M12 adds the install link to this text. Android's share sheet already offers "Copiar", so there is no separate copy button (no `expo-clipboard`). Leaving the view asks nothing; a lost code is cancelled and a new one created.
4. The code appears in the pending list. The invited person creates their own account and types the code in **Tengo un código** (M2 `accept_invite`).

### Member actions (owner, on another member's row)

A bottom sheet with the person's email:
- **Hacer propietario / Hacer revisor** → `rpc('set_member_role', …)`.
- **Quitar de la finca** → a second step in the same sheet with a 72-dp red "Quitar" button (not a system dialog) → `rpc('remove_member', …)`.

Own row: no actions; "Salir de esta finca" is the screen's last button.

### Leave organization

Pending outbox entries of that finca are counted first (`json_extract(payload, '$.organization_id')`, the same match M3's purge uses). If any: "Tienes 3 registros sin sincronizar de esta finca. Si sales se perderán." with **Sincronizar primero** (→ Pendientes) and **Salir igual**, the same pattern as Cerrar sesión. Then `rpc('remove_member', { p_organization_id, p_user_id: me })` and a full sync: M3 already compares `my_memberships()`, purges the finca's rows and drafts, marks its outbox entries "Requiere atención" (discardable in Pendientes), and switches the active finca (the switcher or onboarding when none is left). New here: the purge also deletes the finca's photo files from the phone.

### Online only

All of this goes through B2 RPCs, which check roles at call time and cannot be replayed safely later (an invite queued offline could run after the inviter lost the owner role). The screen loads from the server on focus and after each action; offline it shows "Sin conexión. Conéctate para ver e invitar personas." with a "Reintentar" button. No outbox entries and no local cache for membership lists: this is a home screen, not a field screen.

### Data loading

- Members: `from('organization_members').select('role, user_id, profiles(email, display_name, deactivated_at)').eq('organization_id', id)` (api.md), validated with Zod, owners first, then by name/email.
- Invites (owner only): `from('organization_invites').select('id, label, role, expires_at').eq('organization_id', id).is('accepted_at', null).is('revoked_at', null).gt('expires_at', now)`; columns always listed (`select=*` is refused).

### Errors

B2 RPCs answer `P0001` with a Spanish `message` meant to be shown as is (api.md → Errors); `messageFor` already shows it, and maps `code_collision` and network errors. No module-specific table. `organization_deleted` also starts a full sync so M3 purges the finca.

### Role change while using the app

After any action that touches the current user (leave, or a role change made on another phone or by the admin, A7) the app re-reads `my_memberships()`: actions call `refreshMemberships`, and every full sync already announces the list (M3), so role-based controls switch without a restart. Outbox entries that now fail with RLS go to **Requiere atención** (M3 rules).

## Rejected

- Queueing invites offline: role checks must happen at call time.
- A local `org_members_cache` table for an offline read-only list (2025 spec): a new migration and a cache to keep in step, for a screen used at home with signal.
- A per-module error table: the server's Spanish messages are the contract.
- Sending invitation emails: B2 out of scope; WhatsApp/SMS is how beekeepers talk to helpers.
- `expo-sharing` / `expo-clipboard`: `Share` covers plain text and its sheet copies.

## Security constraints

The UI hides owner actions from reviewers; B2 RPCs enforce them. Members' emails are shown only inside the organization (B2 `profiles` policy). Leaving wipes that organization's local data and photo files.

## Field use

Not a field screen: used at home or before a visit. Still 56-dp targets (72 dp for the main actions), chips for the role, no long press.

## Backend contract used

B2: `create_invite(p_organization_id, p_role, p_label) returns table (invite_id, code, expires_at)`, `revoke_invite(p_invite_id)`, `set_member_role(p_organization_id, p_user_id, p_role)`, `remove_member(p_organization_id, p_user_id)`, `my_memberships()`, `accept_invite(p_code)` (M2); tables `organization_members`, `organization_invites` (explicit columns), `profiles` (incl. `deactivated_at`, A7). The admin panel can change the same memberships (A7); the app notices through `my_memberships()`.

## Out of scope

Per-apiary access, a read-only viewer role, invitation deep links (`landak://join/<code>` later), transferring ownership as one action (invite owner + leave), the install link in the share text (M12).
