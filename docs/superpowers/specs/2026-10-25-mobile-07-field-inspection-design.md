# M7 · Inspection field mode (manual) and quick notes — spec

Date: 2026-10-25 · Branch: `feat/m7-field-inspection` · Status: **awaiting OK** · Version: 0.7.0

## Problem

The inspection is recorded with the hive open: gloves, veil, bees, sun, one free hand, no signal. Every field must be settable with big taps and no keyboard. Nothing can be lost if the phone locks, the app is killed, or the beekeeper walks to the next hive mid-way. A half-filled inspection is better than none.

## Decisions

### Route and access

`src/app/hive/[id]/inspect.tsx`, opened from "Nueva revisión" (M6). Owners and reviewers both inspect (B4). The platform admin has no membership and never sees the button. Any non-deleted hive can be inspected; a non-`active` status shows in the header ("Muerta") but does not block.

### Layout (exactly `DESIGN.md` → Field mode)

1. `FieldHeader` (sticky): apiary › hive name, "Última revisión hace 12 días", `SyncChip`.
2. `ActionGrid` (2 columns, 96-dp `ActionTile`s, `honey` + `deep`):

| Tile | Icon | Action | Available from |
|------|------|--------|----------------|
| Dictar | `mic` | Dictation → proposed fields (M8) | M8 (hidden until then) |
| Foto | `camera` | Camera with `ShutterButton` (M9) | M9 (hidden until then) |
| Nota 1 | `sticky-note` | Note sheet, slot 1 | M7 |
| Nota 2 | `sticky-note` | Note sheet, slot 2 | M7 |
| Nota | `plus` | Note sheet, next free slot (3, 4…) | M7 |
| Terminar | `check` | Save the inspection | M7 |

A tile whose note slot is filled shows a check badge and the first words; tapping again edits it.

3. Structured fields, grouped in collapsible sections (all open by default, state remembered per user):

| Section | Field (B4 column) | Control | Values (Spanish label) |
|---------|-------------------|---------|------------------------|
| Colonia | `population_strength` | `ScaleField` 1–5 | 1 Muy débil · 2 Débil · 3 Normal · 4 Fuerte · 5 Muy fuerte |
| | `temperament` | `ScaleField` 1–5 | 1 Muy mansa · 2 Mansa · 3 Normal · 4 Defensiva · 5 Muy defensiva |
| | `queen_seen` | `TriStateField` | Sí · No · No revisado |
| | `eggs_seen` | `TriStateField` | Sí · No · No revisado |
| | `larvae_seen` | `TriStateField` | Sí · No · No revisado |
| | `queen_cells` | `ChipSelect` single | Ninguna · Enjambrazón · Reemplazo · No revisado |
| Cría y reservas | `brood_frames` | `StepperField` 0–40 | — |
| | `brood_pattern` | `ChipSelect` single | Compacta · Salteada · No revisado |
| | `honey_frames` | `StepperField` 0–40 | — |
| | `pollen_frames` | `StepperField` 0–40 | — |
| | `stores` | `ChipSelect` single | Bajas · Normales · Altas · No revisado |
| Sanidad | `varroa_method` | `ChipSelect` single | Lavado con alcohol · Azúcar glas · Lámina adhesiva · Visual |
| | `varroa_sample_size` | `StepperField` (step 50, default 300 for wash/roll; hidden for board/visual) | — |
| | `varroa_count` | `StepperField` 0–999 | — + live "Carga: 2,3 %" when sample size set |
| | `pests` | `ChipSelect` multi | Polilla de la cera · Pequeño escarabajo · Hormigas · Avispas · Ratones · Otra |
| | `disease_signs` | `ChipSelect` multi | Cría yesada · Cría ensacada · Signos de loque · Alas deformes · Disentería · Abejas muertas · Otro — section caption: "Signos observados, no es un diagnóstico" |
| Trabajo | `attention_level` | `ChipSelect` single | Sin novedad · Pronto · Urgente |
| | `next_inspection_on` | `ChipSelect` single + `StepperField` | En 7 días · En 14 días · En 21 días · Otro (stepper of days 1–90) → date shown "mar 4 nov" |
| | `weather` | `ChipSelect` single | Soleado · Nublado · Lluvia · Viento |
| | `temperature_c` | `StepperField` −20..60 step 1 | — |
| | `notes` | "Escribir" button → text sheet (keyboard only here) | — |

Every field starts **unset** (null). Tapping the selected chip again clears it. `not_checked` is an explicit choice, never a default. No dropdowns, no date picker, no keyboard except the notes sheets.

`inspected_at` = when the draft was created; `inspected_by` = current user; `source` = `manual` (M8 switches it to `voice` when dictation is accepted).

### Varroa helper

`src/features/inspections/varroa.ts`: `varroaLoadPercent(count, sampleSize)` = `count / sampleSize × 100`, one decimal, `null` when either is missing or sample is 0. Shown live; not stored (derivable). Coherence mirrors B4: method and count both set or both null; sample size required for `alcohol_wash` / `sugar_roll`. If the user sets a count without a method, the method chips pulse and "Terminar" shows the missing method inline instead of failing on the server.

### Validation

`src/features/inspections/schema.ts`: Zod schema mirroring every B4 check (ranges, enums, array subsets, varroa coherence, `inspected_at ≤ now + 1 day`, `notes` ≤ 4000, transcript ≤ 10000). It runs before saving, so the outbox never pushes a row the server would reject. The note text is checked ≤ 2000.

### Drafts

Local-only table (SQLite migration in this module, never synced):

```sql
inspection_drafts (
  id text primary key,          -- the future inspection id (uuid), so photos (M9) can link to it
  organization_id text not null,
  hive_id text not null unique, -- one open draft per hive per phone
  payload text not null,        -- JSON of the inspection fields
  notes text not null,          -- JSON array [{ slot, text, source }]
  created_at text not null,
  updated_at text not null
)
```

- Autosave on every change (debounced 300 ms; one `update`).
- Opening field mode on a hive with a draft resumes it with a toast "Continuando la revisión de las 9:40".
- The hive screen (M6) shows "Revisión sin terminar" with Continuar / Descartar (undo toast) when a draft exists.
- Drafts older than 7 days stay; the Pendientes tab lists them (never silently dropped).

### Notes

Note sheet (`src/features/inspections/NoteSheet.tsx`): big multi-line text field, "Guardar nota" 72 dp, "Borrar nota". M8 adds a 96-dp "Dictar" button inside it. Each note becomes a `hive_events` row: `type = 'note'`, `inspection_id` = the inspection id, `occurred_at` = note time, `details = { text, source: 'text' | 'voice', slot }`.

### Terminar

1. Zod validate; problems are listed inline at the top with "Ir al campo" links (no dialog).
2. One local transaction (`saveLocal` from M3): insert `inspections` row + one `hive_events` note per filled slot + outbox entries + delete the draft.
3. Success haptic, toast "Guardado en este dispositivo" (3 s) with **Deshacer**, return to the hive screen.
4. Deshacer: if the outbox entries have not been pushed, remove the rows and entries and restore the draft; if already pushed, set `deleted_at` on the inspection and its notes (soft delete, synced) and restore the draft.
5. An inspection with no field set and no notes still saves (the visit itself is information); Terminar label stays the same.

### Device behavior

`expo-keep-awake` active while the screen is mounted; `expo-haptics` light impact on every control tap, success notification on save; back gesture/button keeps the draft (no "discard changes?" dialog).

## Rejected alternatives

- A multi-step wizard: more taps, harder to skip what was not checked.
- Required fields: forces invented data (overview §3).
- Native date picker for next inspection: small targets, keyboard-like; relative chips + stepper cover the field case.
- Storing the draft in memory/AsyncStorage: lost on kill or not transactional with the final save.

## Security constraints

- Edits of a saved inspection (from M6's read view) are allowed to the author or an owner, mirroring B4 RLS; anything else would be refused by the server and marked "Requiere atención".
- `created_by` / `inspected_by` are set from the session, never from a picker (B3 `force_author`, B4 `not_member`).

## Field use

- Every control ≥ 72 dp, ≥ 12 dp apart; all values readable at 32 sp.
- Complete inspection possible with taps only, gloves on, no keyboard.
- Airplane mode: everything works; sync chip shows "Pendiente".
- Phone locks or the app is killed: the draft resumes exactly.
- Undo instead of confirmations.

## Backend contract used

- `inspections` (B4): all columns listed above, constraints mirrored in Zod.
- `hive_events` (B4): `type = 'note'`, `inspection_id`, `occurred_at`, `details = { text (required, ≤ 2000), source, slot }`.
- Soft delete via `deleted_at`; upsert by client id (B1 conventions).

## Out of scope

Dictation (M8), photos (M9), recording other events from field mode (M10), "jornada" mode walking several hives in sequence, choosing another member as inspector.
