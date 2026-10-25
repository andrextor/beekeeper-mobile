# M11 · Members: invite reviewers, roles, leave organization — spec

Date: 2026-10-25 · Branch: `feat/m11-members` · Status: **awaiting OK** · Version: 0.11.0

## Problem

The beekeeper (owner) wants other people — a helper, a technician, a family member — to enter the app and inspect their hives as reviewers, and to remove them later. Reviewers need to see who else is in the organization and be able to leave it.

## Decisions

### Screens (Perfil → "Personas de <organización>")

| Screen | Owner | Reviewer |
|--------|-------|----------|
| Members list (email, name, role badge, "Tú") | yes, each row opens actions | yes, read-only |
| Pending invites (email, role, date) | yes, "Cancelar invitación" | hidden (RLS does not return them) |
| "Invitar persona" button (72 dp, bottom) | yes | hidden |
| "Salir de esta organización" | yes (refused if last owner) | yes |

### Invite flow (owner)

1. Email field (`keyboardType="email-address"`, `autoCapitalize="none"`), role segmented control **Revisor** (default) / **Propietario** with one-line explanations:
   - Revisor: "Puede ver todo y registrar revisiones, notas, fotos y actividades. No puede cambiar apiarios ni colmenas."
   - Propietario: "Puede hacer todo, incluso invitar y quitar personas."
2. `rpc('invite_member', { p_organization_id, p_email, p_role })`.
3. Success screen with **"Compartir invitación"** → React Native `Share.share` (no extra dependency) with the message:
   "Te invité a Landak Apiario para ayudarme con mis colmenas de <organización>. Instala la app e ingresa con este correo: <email>. <install link from M12>"
4. The invite appears in the pending list. When the person signs in, M2 already calls `accept_my_invites()`.

### Member actions (owner, on a member row)

- **Cambiar rol** → `rpc('set_member_role', …)`.
- **Quitar de la organización** → `rpc('remove_member', …)`; this is a destructive action outside field mode, so it uses a bottom sheet with the person's email and a 72-dp red "Quitar" button (not a system dialog).
- Own row: only "Salir de esta organización".

### Leave organization

`rpc('remove_member', { p_organization_id, p_user_id: auth.uid() })`. On success: the app deletes that organization's local rows and photos (it can no longer sync them), switches to another membership or to onboarding (M2). Pending outbox entries for that organization are shown first: "Tienes 3 registros sin sincronizar de esta organización. Sincroniza antes de salir." and leaving is blocked until they sync or the user explicitly discards them.

### Online only

All of this goes through B2 RPCs, which check roles at the moment of the call and cannot be replayed safely later (an invite queued offline could run after the inviter lost the owner role). Offline, the screen shows the last loaded list with "Sin conexión. Conéctate para invitar o cambiar personas." and the action buttons disabled. No outbox entries for membership changes.

### Data loading

- Members: `organization_members` select with embedded `profiles(email, display_name)` (FK `user_id → profiles`, readable via `shares_org`), for the current organization.
- Invites (owner): `organization_invites` where `organization_id = …` and `accepted_at is null and revoked_at is null`.
- Cached in SQLite (`members_cache`) for the offline read-only view; refreshed on screen focus and after every action.

### Error mapping (`detail` → Spanish, `src/features/members/errors.ts`)

| `detail` | Message |
|----------|---------|
| `not_owner` | Solo el propietario de la organización puede hacer esto. |
| `already_member` | Esa persona ya es parte de la organización. |
| `invalid_email` | Revisa el correo, parece que no está bien escrito. |
| `invalid_role` | Elige Revisor o Propietario. |
| `last_owner` | La organización debe tener al menos un propietario. |
| `not_member` | Esa persona ya no es parte de la organización. |
| `invite_not_pending` | Esa invitación ya fue aceptada o cancelada. |
| `not_allowed` | No tienes permiso para quitar a esa persona. |
| `not_signed_in` | Tu sesión terminó. Ingresa de nuevo. |
| network / other | No pudimos completar la acción. Revisa tu conexión e inténtalo de nuevo. |

The app shows the server's Spanish `message` when `detail` is unknown, the generic line if there is none.

### Role change while using the app

After any membership change the app re-reads `my_memberships()`; if the current user's role changed (for example demoted to reviewer on another phone), the UI switches its role-based controls immediately, and outbox entries that now fail with RLS errors go to **Requiere atención** (M3 rules).

## Rejected

- Queueing invites offline: role checks must happen at call time (above).
- Sending invitation emails from the backend: B2 out of scope; the Share sheet uses the beekeeper's own WhatsApp/SMS, which is how they talk to helpers anyway.
- `expo-sharing`: it shares files; plain text needs only React Native's `Share`.

## Security constraints

The UI hides owner actions from reviewers; B2 RPCs enforce them. Emails of members are shown only inside the organization (B2 `profiles` policy). Leaving wipes that organization's local data.

## Field use

Not a field screen: used at home or before a visit. Still 56-dp targets, big role control, no long press.

## Backend contract used

B2: `invite_member(p_organization_id, p_email, p_role)`, `revoke_invite(p_invite_id)`, `set_member_role(p_organization_id, p_user_id, p_role)`, `remove_member(p_organization_id, p_user_id)`, `my_memberships()`, `accept_my_invites()` (M2); tables `organization_members`, `organization_invites`, `profiles`; error `detail` codes listed above.

## Out of scope

Per-apiary access, a read-only viewer role, invitation links with tokens, transferring ownership as a single action (done as invite owner + leave).
