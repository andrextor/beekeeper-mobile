# M4 · Apiaries and hives — spec

Date: 2026-10-25 · Branch: `feat/m4-apiaries-hives` · Status: **awaiting OK** · Version: 0.4.0

## Problem

An owner registers their sites ("Vallecito 1") and the hives in each, with the facts that describe the colony (type, boxes, origin, age, queen), offline. A reviewer sees the same lists but cannot change them. Both need to find a hive fast.

## Decisions

### Roles in the UI (mirror of B3 RLS)

| | owner | reviewer |
|--|-------|----------|
| See apiaries and hives | yes | yes |
| Create / edit / delete apiary or hive | yes | no — buttons hidden, edit routes redirect to the detail with "Solo el propietario puede editar." |

### Screens

**Apiarios tab** (`(tabs)/apiaries.tsx`): search field (name or farm), list of `apiaries` of the active organization where `deleted_at is null`, ordered by name. Item: name (Arsenal 20), farm name · place, "N colmenas activas", last inspection relative (from local `inspections`). Owner: floating "Nuevo apiario" button (56 dp, bottom right, thumb zone). Empty state: owner "Crea tu primer apiario" + button; reviewer "Este apicultor aún no tiene apiarios.".

**Apiary detail** (`apiary/[id]/index.tsx`): header with facts (farm, place, altitude, flora, water, notes; "Ver en mapa" opens `geo:` intent only when coordinates exist). Hive list with chips **Activas** (default) / **Todas**; item: name, status badge, type, queen color dot, last inspection, attention badge from the last inspection's `attention_level`. Owner: "Nueva colmena", "Editar apiario".

**Hive facts** (`hive/[id]/index.tsx` header part; the timeline below is M6): name, apiary, status, type, brood boxes / supers, origin, age, race, queen (year, color dot + name, marked, origin), notes. Owner: "Editar".

### Forms (owner only)

`apiary/new`, `apiary/[id]/edit`:

| Field | Control | Rule (B3) |
|-------|---------|-----------|
| Nombre * | TextField | 1..80, unique per organization (local check first, server is final) |
| Finca | TextField | ≤ 80 |
| Lugar (municipio, vereda) | TextField | ≤ 120 |
| Ubicación | "Usar mi ubicación" button (`expo-location`, foreground, one reading) + shows lat/lng; "Quitar" | both or neither, 6 decimals |
| Altitud (m) | number | −100..6000; prefilled from the location reading when available |
| Floración / cultivos cercanos | multiline | ≤ 2000 |
| Fuente de agua | TextField | ≤ 200 |
| Notas | multiline | ≤ 2000 |

`hive/new?apiaryId=`, `hive/[id]/edit`:

| Field | Control | Values → Spanish label (from `lib/labels.ts`) |
|-------|---------|------------------------------------------------|
| Nombre * | TextField, suggested next name ("C-13" after the highest `C-n`) | 1..40, unique per organization |
| Apiario * | picker of the organization's apiaries | moving = transfer; the app also writes a `transfer` event in M10 |
| Tipo | ChipSelect | `langstroth` Langstroth · `dadant` Dadant · `top_bar` Kenyana / barra superior · `warre` Warré · `nucleus` Núcleo · `rustic` Rústica · `other` Otra |
| Cámaras de cría | StepperField 0..5 | |
| Alzas | StepperField 0..10 | |
| Origen de la colonia | ChipSelect | `swarm_capture` Captura de enjambre · `split` División · `package` Paquete · `nucleus_purchase` Núcleo comprado · `colony_purchase` Colonia comprada · `unknown` Desconocido |
| Inicio de la colonia | date picker (native) | ≤ today; shows "Edad: 1 año y 3 meses" live |
| Raza | TextField with suggestions "Africanizada", "Italiana", "Carniola" | ≤ 60 |
| Año de la reina | StepperField (current year default when the section is opened) | 2000..2100 |
| Color de marca | 5 color circles + "Sin marca" | `white` Blanco · `yellow` Amarillo · `red` Rojo · `green` Verde · `blue` Azul; **suggested from the year** (last digit 1/6 white, 2/7 yellow, 3/8 red, 4/9 green, 5/0 blue) with the hint "Color internacional para 2026: blanco"; the user can override |
| Reina marcada | TriStateField Sí / No / No sé | `true` / `false` / `null` |
| Origen de la reina | ChipSelect | `own_rearing` Cría propia · `purchased` Comprada · `natural` Natural · `unknown` Desconocido |
| Estado | ChipSelect (edit only; new = `active`) | `active` Activa · `inactive` Inactiva · `dead` Muerta · `absconded` Fugada · `merged` Unida · `sold` Vendida |
| Notas | multiline | ≤ 2000 |

- `qr_code` is generated on create (M5 provides `newQrCode()`; until then this module includes the generator, 10 chars Crockford base32 from `expo-crypto` random bytes) and is not editable here (re-label is M5).
- Validation with Zod schemas in `src/features/hives/schema.ts` / `src/features/apiaries/schema.ts`, mirroring every B3 rule, so a permanent push failure is rare.
- Save → `saveRow` (M3) → toast "Guardado en este dispositivo" → back to the detail.

### Soft delete (owner)

"Eliminar apiario" / "Eliminar colmena" at the bottom of the edit form (danger, outside field mode, so a confirm sheet is allowed). Sets `deleted_at` via `saveRow`. Apiary with any non-deleted hive (dead ones included): blocked locally with "El apiario todavía tiene colmenas. Muévelas o elimínalas primero." (same rule as B3 `apiary_not_empty`; `23505` unique violations map to `duplicate_name` / `qr_taken` through the constraint table in `docs/api.md`). Undo snackbar for 5 s after delete.

### Server rejections

`duplicate_name`, `qr_taken`, `parent_mismatch`, `apiary_not_empty`, `not_owner` arrive as permanent outbox failures (M3) and show in Pendientes with their Spanish messages; tapping "Revisar" opens the edit form with the field highlighted. `qr_taken`: the app regenerates the code and re-queues automatically (no user action).

### Helpers

`src/features/hives/age.ts` (`colonyAge(startedOn, today)` → "3 meses", "1 año y 3 meses"; `null` → "Edad desconocida") and `queen-color.ts` (`suggestQueenColor(year)`), both with tests.

## Field use

Owners usually create apiaries and hives at the apiary, gloved: steppers and chips instead of keyboards for every field except names and notes; the hive form's save button is fixed at the bottom; "Usar mi ubicación" works offline (GPS needs no signal).

## Security constraints

The UI hides owner actions for reviewers, but RLS (B3) is what refuses them; a reviewer's forged write ends as "Requiere atención — Solo el propietario…". Location permission is asked only when the user taps "Usar mi ubicación".

## Backend contract used (B3)

Tables `apiaries` (`name`, `farm_name`, `place`, `latitude`, `longitude`, `altitude_m`, `flora_notes`, `water_source`, `notes`) and `hives` (`apiary_id`, `name`, `qr_code`, `hive_type`, `brood_boxes`, `supers`, `colony_origin`, `colony_started_on`, `bee_race`, `queen_year`, `queen_marked`, `queen_color`, `queen_origin`, `status`, `notes`) with the common columns; error details `duplicate_name`, `qr_taken`, `parent_mismatch`, `apiary_not_empty`, `not_owner`.

## Out of scope

QR label printing and scanning (M5), timeline (M6), maps, bulk hive creation (later: "Crear 10 colmenas" is a good V1.1 candidate).
