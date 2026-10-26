# M7 · Inspection field mode — plan

Spec: `docs/superpowers/specs/2026-10-25-mobile-07-field-inspection-design.md` · Branch: `feat/m7-field-inspection` · Status: **awaiting OK**

New dependencies (approval asked here; `pnpm expo install`; skip any already added in M1): `expo-keep-awake`, `expo-haptics`.

1. **Schema and helpers** — `src/features/inspections/schema.ts` (Zod mirroring B4) + `schema.test.ts` (every range edge, unknown pest, varroa coherence cases, sample size required for wash/roll, `inspected_at` +2 days refused, empty inspection valid); `varroa.ts` + test; `next-date.ts` (`addDays` in local zone) + test.
2. **Drafts table** — `src/db/migrations/0002_inspection_drafts.ts` (local only, excluded from the sync table list) + `src/features/inspections/drafts.ts` (`openDraft(hiveId)`, `openEditDraft(inspectionId)`, `updateDraft`, `discardDraft`, `listDrafts`) + test on the M3 test database (one new draft per hive, an edit draft coexists, resume returns the same id).
3. **Field components** — `src/components/field/{ScaleField,TriStateField,StepperField,ChipSelect,ActionTile,ActionGrid,FieldHeader}.tsx` with haptics, tap-again-to-clear, `accessibilityLabel`/`accessibilityValue`; if M1 already built some, only extend.
4. **Field mode screen** — `src/app/hive/[id]/inspect.tsx`, `src/features/inspections/{FieldInspection,FieldSections}.tsx`: sections from the spec table, labels from `src/lib/labels.ts`, autosave debounce 300 ms, keep-awake, resume toast.
5. **Notes** — `src/features/inspections/NoteSheet.tsx`, slot logic in `drafts.ts`, filled-slot badges on tiles.
6. **Finish and undo** — `src/features/inspections/finish.ts` (validate → one transaction: inspection + note events + outbox + delete draft; `undoFinish` for pushed / not-pushed cases) + test on the M3 test database (row counts, outbox entries, undo before and after push, finishing an undone pushed inspection restores it and its notes, edit keeps note ids).
7. **Draft surfaces** — hive screen "Revisión sin terminar" card (M6 files), Pendientes tab drafts section (M3 files).
8. **Release** — `chore(release): 0.7.0`. Check: `pnpm ci:check`.

## How Iván tests it

On a real Android phone, dev build, **gloves on** for steps 2–5:

1. Airplane mode on. Scan C-01 → "Nueva revisión".
2. Set Fuerza 4, Reina Sí, Huevos No revisado, Cría 3 (stepper), Reservas Pocas, Polilla + Hormigas, Atención Pronto, "En 7 días" — all with taps, no keyboard. Tap Reservas Pocas again → cleared; set it again.
3. Varroa: Lavado con alcohol → sample 300 → count 7 → "Carga: 2,3 %".
4. Nota 1 → type "Falta una alza" → Guardar. Lock the phone, wait 30 s, unlock → still there. Kill the app from recents, reopen, scan C-01 → "Continuando la revisión…" with everything intact.
5. Terminar → vibration + "Guardado en este dispositivo" → hive screen shows it in the timeline as Pendiente. Tap Deshacer → back in field mode with the data.
6. Terminar again, wait out the toast. Airplane mode off → chip turns "Sincronizado"; Studio shows one inspection and one note event (no duplicates). Toggle airplane mode on/off twice more → still one of each.
7. As `reviewer@landak.test`: inspect C-02 and finish → synced. Open the owner's inspection of C-01 → no Editar button. Open your own C-02 inspection → Editar → change Fuerza → Terminar → synced, still one inspection and the same note.
8. Open field mode and tap Terminar without touching anything → saves an empty visit.
