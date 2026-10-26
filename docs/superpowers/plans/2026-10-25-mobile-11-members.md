# M11 · Members — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-11-members-design.md` · Branch: `feat/m11-members` · Status: **awaiting OK** (revised 2026-10-26)

No new dependencies (`Share` is part of React Native). No migration.

1. **API** — `src/features/members/api.ts`: `fetchMembers` (Zod-validated, owners first), `fetchInvites`, `createInvite`, `revokeInvite`, `setMemberRole`, `removeMember`; `sortMembers` + `api.test.ts`.
2. **Invite message** — `src/features/members/invite-message.ts` + test (finca name, code, expiry date).
3. **Members screen** — `src/app/members.tsx` (list, "Tú", "Desactivado", pending codes, offline notice + Reintentar), `src/features/members/MemberRow.tsx`; Perfil gets "Personas de la finca"; route in `_layout.tsx`.
4. **Invite** — `src/app/invite.tsx`: label + role chips → `create_invite` → code view + `Share.share`.
5. **Member actions** — `src/features/members/MemberSheet.tsx` (change role, remove with a second step); "Cancelar código" on pending codes.
6. **Leave** — `src/features/members/leave.ts` (`pendingForFinca`), leave sheet on the members screen (Sincronizar primero / Salir igual) → `remove_member` + `syncNow`; `src/features/sync/pull.ts` purge also deletes the finca's photo files.
7. **Release** — `chore(release): 0.11.0`, CHANGELOG, row 10 in `docs/phone-pass.md`. Check: `pnpm ci:check`.

## How Iván tests it

Row 10 of `docs/phone-pass.md`:

1. Owner phone online: Perfil → Personas de la finca → Invitar persona → "Ayudante", Revisor → the code appears → Compartir por WhatsApp → send it to yourself.
2. Second phone: Crear cuenta → Tengo un código → the code → lands in the finca as Revisor, sees the hives, no "Invitar persona". The same code on a third account → "El código no es válido…".
3. Owner: Ayudante → Hacer propietario → the second phone shows owner controls after the next sync; back to Revisor.
4. Owner (only owner) → Salir de esta finca → "La finca debe tener al menos un propietario" (server message).
5. Airplane mode → Personas shows the offline notice; Reintentar after airplane off loads the list.
6. Reviewer phone: an inspection offline, then Salir → warning with the count; Sincronizar primero, then Salir → the finca and its photos are gone from that phone.
7. Owner: another code → Cancelar código → gone; typing it → "El código no es válido…".
8. Admin panel: change the helper's role / remove them → after the next sync the helper's phone follows. Admin deactivates the helper → Personas shows "Desactivado".
