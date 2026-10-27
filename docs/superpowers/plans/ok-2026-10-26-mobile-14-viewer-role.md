# M14 · Read-only role "Observador" — plan

Spec: `docs/superpowers/specs/ok-2026-10-26-mobile-14-viewer-role-design.md` · Branch: `feat/m14-viewer-role` (from `main` at v1.1.1) · Status: **approved** (Iván, 2026-10-26)

- No new dependency. No native change: it reaches phones by OTA once released.
- Backend: `beekeeper` main 0.17.0 (B8 merged).
- **Ship order:** this release (APK or OTA) reaches every phone before anyone gets `viewer` in the remote Supabase.

## Tasks (one commit each)

1. **Roles parse and label.** `fix(members): parse the viewer role; unknown roles read as viewer`
   - **Files:**
     - `src/features/sync/members.ts`: exported `roleSchema` with `.catch('viewer')`, plus `canRecord(role)`.
     - `src/features/members/api.ts`: imports `roleSchema`.
     - `src/lib/labels.ts`: `viewer: 'Observador'`.
     - `src/features/auth/session.tsx`: `useCanRecord()`.
   - **Tests:**
     - `src/features/sync/members.test.ts` (new): `parseMemberships` keeps `viewer`, an unknown role becomes `viewer`, and `canRecord` returns true for owner and reviewer, false for viewer and `null`.
     - `src/features/members/api.test.ts`: a `viewer` sorts with the non-owners.

2. **Outbox refuses a viewer's write.** `feat(sync): the outbox never takes a write from an observador`
   - **Files:** `src/db/write.ts`. Before the transaction, it reads `members_cache` for the rows' `organization_id`s. If any is `viewer`, it throws `{ code: '42501' }` and writes nothing.
   - **Tests:** `src/db/write.test.ts`:
     - with a `viewer` row in `members_cache`, `saveRow` rejects and the table and outbox stay empty;
     - with `reviewer`, it saves as before.

3. **Read-only screens.** `feat(ui): an observador sees the finca without write buttons`
   - **Files:** these screens use `useCanRecord()`:
     - `src/app/hive/[id]/index.tsx`: bottom bar, draft cards, Registrar actividad and "Tomar foto" are hidden; `canEditEvent` needs `canRecord`.
     - `src/app/hive/[id]/photos.tsx`: Tomar foto is hidden.
     - `src/app/inspection/[id].tsx`: `canEdit` needs `canRecord`.
     - `src/app/photo/[id].tsx`: `canDelete` needs `canRecord`.
   - **Route guards:** these routes show `NotAvailable` with `Eye` and "Como observador puedes ver la finca, pero no registrar cambios.":
     - `src/app/hive/[id]/inspect.tsx`
     - `src/app/hive/[id]/camera.tsx`
     - `src/app/hive/[id]/event/new.tsx`
     - `src/app/hive/[id]/event/[eventId].tsx`

4. **Three roles in invite and person sheet.** `feat(members): invite and change role offer Observador`
   - **Files:**
     - `src/features/members/RolePicker.tsx` (new): the three role chips plus the help line (`roleHelp` moves out of `invite.tsx`).
     - `src/app/invite.tsx`: uses `RolePicker`.
     - `src/features/members/MemberSheet.tsx`: `RolePicker` preselected on the current role, the help line, and a **Cambiar rol** button that is disabled while the role is unchanged. The two-way toggle goes.

5. **Docs.** `docs: M14 observador in roadmap and phone pass`
   - **Files:**
     - `docs/ROADMAP.md`: M14 row.
     - `docs/phone-pass.md`: new section 12, the steps below.

6. **Release.** `chore(release): 1.2.0`: CHANGELOG `[1.2.0]` (Added: Observador; Fixed: an unknown role no longer blanks the app), `package.json` and `app.json` 1.2.0.

Checks at the end (Iván): `pnpm ci:check`.

## How Iván tests it

**Before you start**
- In `../beekeeper`, on `main` (it has B8), run `pnpm db:reset`.
- Start Metro with `pnpm start --clear`.
- Owner: owner@landak.test. Observador-to-be: other@landak.test. Password: `landak-2026`.

**12.1 Change the role**
- ➜ As owner, open Perfil → Personas → other@ (if other@ is not in the finca, invite them first, step 12.2) → Observador chip.
- ✓ The help line changes.
- ✓ Cambiar rol is enabled; tap it.
- ✓ A toast says "… ahora es observador".
- ✓ The badge says Observador.

**12.2 Invite**
- ➜ Invitar persona.
- ✓ There are three chips; each changes the help line.
- ➜ Create a code with Observador and redeem it with a new account.
- ✓ That account enters with the badge Observador.

**12.3 Observador's phone**
- ➜ Sign in as the observador.
- ✓ Inicio shows Para revisar, Tareas and Última actividad.
- ➜ Open a hive.
- ✓ There is no Nueva revisión, no Registrar actividad and no Tomar foto. History, photos and facts are visible.
- ➜ Open an inspection and a photo.
- ✓ There is no Editar, Borrar or Borrar foto.
- ➜ Scan a hive's QR.
- ✓ It opens the hive read-only.
- ✓ Pendientes stays empty.

**12.4 Observador offline:** put the phone in airplane mode.
- ✓ Everything already loaded is still readable.

**12.5 Back to revisor**
- ➜ The owner changes the role back to Revisor.
- ➜ On the other phone, pull to sync, or reopen the app.
- ✓ The write buttons come back without signing out.
