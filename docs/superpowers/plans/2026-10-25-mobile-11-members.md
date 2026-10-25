# M11 · Members — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-11-members-design.md` · Branch: `feat/m11-members` · Status: **awaiting OK**

No new dependencies (`Share` is part of React Native).

1. **API + errors** — `src/features/members/api.ts` (typed wrappers for the five RPCs + members/invites selects), `src/features/members/errors.ts` + `errors.test.ts` (every `detail`, unknown → server message → generic).
2. **Cache** — `src/db/migrations/00XX_members_cache.ts`, `src/features/members/cache.ts` (offline read-only list).
3. **Members screen** — `src/app/profile/members.tsx`, `MemberRow.tsx`, `PendingInvites.tsx`, offline banner and disabled actions.
4. **Invite** — `src/app/profile/invite.tsx` (email + role), success view with `Share.share` message (`src/features/members/inviteMessage.ts` + test).
5. **Member actions** — `MemberActionsSheet.tsx` (change role, remove), confirmation sheet for removal.
6. **Leave organization** — `src/features/members/leave.ts` (pending-outbox guard, local wipe for the organization, switch membership) + `leave.test.ts`.
7. **Role refresh** — re-read `my_memberships()` after actions and on app focus; role-dependent UI reacts.
8. **Release** — `chore(release): 0.11.0`. Check: `pnpm ci:check`.

## How Iván tests it

1. Owner phone online: Perfil → Personas → Invitar persona → `ayudante@…` (a real email you can read), Revisor → Compartir invitación → send it to yourself on WhatsApp.
2. Second phone: install, sign in with that email → lands in "Finca Landak" as Revisor, sees the hives, cannot see "Invitar persona".
3. Owner: change the helper to Propietario → second phone shows owner controls after reopening the screen; change back to Revisor.
4. Owner tries to leave while being the only owner → "La organización debe tener al menos un propietario.".
5. Airplane mode on the owner phone → list still visible, buttons disabled, offline message.
6. Reviewer phone: create an inspection offline, then try "Salir" → blocked by the unsynced warning; sync, leave → the organization's data disappears from that phone.
7. Owner: cancel a pending invite → gone from the list; that email signing in later gets no access.
