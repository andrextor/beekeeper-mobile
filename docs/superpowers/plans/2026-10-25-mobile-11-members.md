# M11 · Members — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-11-members-design.md` · Branch: `feat/m11-members` · Status: **awaiting OK**

No new dependencies (`Share` is part of React Native).

1. **API + errors** — `src/features/members/api.ts` (typed wrappers for the five RPCs + members/invites selects), `src/features/members/errors.ts` + `errors.test.ts` (every `detail`, unknown → server message → generic).
2. **Cache** — `src/db/migrations/0004_org_members_cache.ts`, `src/features/members/cache.ts` (offline read-only list, replaced whole per organization) + test on the M3 test database.
3. **Members screen** — `src/app/members.tsx`, `MemberRow.tsx` ("Desactivado" badge), `PendingInvites.tsx`, offline banner and disabled actions.
4. **Invite** — `src/app/invite.tsx` (label + role → `create_invite`), success view with the code, "Copiar código" and the `Share.share` message (`src/features/members/inviteMessage.ts` + test).
5. **Member actions** — `MemberActionsSheet.tsx` (change role, remove), confirmation sheet for removal.
6. **Leave organization** — `src/features/members/leave.ts` (pending-outbox guard, local wipe for the organization, switch membership) + `leave.test.ts`.
7. **Role refresh** — re-read `my_memberships()` after actions and on app focus; role-dependent UI reacts.
8. **Release** — `chore(release): 0.11.0`. Check: `pnpm ci:check`.

## How Iván tests it

1. Owner phone online: Perfil → Personas → Invitar persona → "Ayudante", Revisor → the code appears → Compartir por WhatsApp → send it to yourself.
2. Second phone: install, Crear cuenta with any email + password → Tengo un código → paste the code → lands in "Finca Landak" as Revisor, sees the hives, cannot see "Invitar persona". Using the same code on a third account → "El código no es válido…".
3. Owner: change the helper to Propietario → second phone shows owner controls after reopening the screen; change back to Revisor.
4. Owner tries to leave while being the only owner → "La finca debe tener al menos un propietario.".
5. Airplane mode on the owner phone → list still visible, buttons disabled, offline message.
6. Reviewer phone: create an inspection offline, then try "Salir" → blocked by the unsynced warning; sync, leave → the organization's data disappears from that phone.
7. Owner: create another code and cancel it → gone from the list; typing it later → "El código no es válido…".
8. Admin panel: change the helper's role in Finca Landak → on the helper's phone, after the next sync, the owner controls appear or disappear; Admin → Quitar de la finca → after the next sync the organization and its data are gone from the helper's phone.
9. Once A7 is merged: Admin deactivates the helper → the owner's Personas shows "Desactivado" on that row.
