# DESIGN.md — Landak Apiario app

Design system of the Android app. Palette, fonts and icon set are **the same as the admin** (`../beekeeper/DESIGN.md`); this file adds the field-mode rules and the native components. A token change is copied to both files.

## Context of use

Suit, veil, thick gloves, bees in the air, strong sun or shade under trees, one hand busy holding a frame, no signal. The screen is often seen through a veil mesh at arm's length. Design for that first; the comfortable office case follows.

## Palette

Brand: `deep #04303b`, `leaf #0c6511`, `sprout #82c75c`, `honey #ffb545`, `pollen #e8e454`. Neutrals: `stone-50 #fafaf7` … `stone-900 #1f1d19` (values in `../beekeeper/DESIGN.md`).

**Light theme only in V1**: sunlight readability beats dark mode. Dark mode is a later spec.

| Token | Value | Use |
|-------|-------|-----|
| `bg` | `#ffffff` | Field mode background (maximum contrast) |
| `bg-soft` (canvas) | `#f6f5f0` | Screen background behind cards (deep on it 12.9:1) |
| `fill` | `stone-100` | Input and segmented-control fill |
| `surface` | `#ffffff` + `shadow.card` (no border) | Cards float on the canvas |
| `text` | `deep` | All body text (≈ 13:1 on white) |
| `text-muted` | `stone-700` | Secondary text (never `stone-500` outdoors) |
| `primary` / `on-primary` | `leaf` / `#ffffff` | Main actions (Guardar, Nueva revisión) |
| `accent` / `on-accent` | `honey` / `deep` | Field action buttons, pending states |
| `danger` / `on-danger` | `#b42318` / `#ffffff` | Attention, destructive |
| `primary-soft` / `on-primary-soft` | `#e7f4e4` / `#0a5410` | Tonal buttons (`secondary`), success, active tab pill (8.1:1) |
| `accent-soft` | `#fff1d6` | Pending and offline callouts (deep on it 12.6:1) |
| `danger-soft` / `on-danger-soft` | `#fdecea` / `#8a1c12` | Error callouts and field errors (8.1:1) |
| `mist` | `#a9c7cc` | Secondary text on `deep` bands (7.9:1) |
| `queen-white` … `queen-blue` | `#ffffff` `#facc15` `#dc2626` `#16a34a` `#2563eb` | Queen-marking dots only (international colours, same as the admin), always next to the color's name |

Rules: no text lighter than `stone-700`; `sprout` and `pollen` are decorative only; white on `honey` is forbidden; color never carries meaning alone (always icon + word).

### Sync states (shared vocabulary with the admin)

| State | Label | Look |
|-------|-------|------|
| Saved on device | Guardado en este dispositivo | `honey` chip, `smartphone` icon |
| Pending | Pendiente de sincronizar (N) | `honey` outline, `cloud-upload` |
| Synced | Sincronizado | `leaf` text, `cloud-check` |
| Requires attention | Requiere atención | `danger` chip, `triangle-alert`, tap opens the reason |

## Typography

Plus Jakarta Sans (headings, hive names, big numbers) and Inter (everything else), via `@expo-google-fonts/plus-jakarta-sans` and `@expo-google-fonts/inter`. The app respects the system font scale up to 1.3× without breaking layouts.

| Role | Size (sp) | Font |
|------|-----------|------|
| Field button label | 22, 600 | Inter |
| Field value (stepper, scale) | 32, 700 | Plus Jakarta Sans |
| Screen title | 26, 700 | Plus Jakarta Sans |
| Section title | 20, 700 | Plus Jakarta Sans |
| Body | 17 | Inter |
| Caption | 15 | Inter (minimum anywhere) |

## Icons

`lucide-react-native` (+ `react-native-svg`), stroke 2.25 in field mode for legibility. Sizes: 24 standard, 36 in field buttons, 56 in the scan button. Same domain glyphs as the admin: hive `Honeycomb` (three cells, `src/components/ui/icons.ts`; the admin still draws `hexagon`), apiary `map-pin`, inspection `clipboard-check`, note `sticky-note`, photo `camera`, voice `mic`, QR `scan-qr-code` (scan) / `qr-code` (label), feeding `droplet`, treatment `syringe`, harvest `package`, queen `crown`, sync `cloud-upload`/`cloud-check`.

## Layout and touch

- 8-dp grid; screen padding 16 dp. Radii: inputs `field` 16, cards `card` 24, sheets `sheet` 28, buttons and chips `button` (pill). Shadows from `shadow` in `src/lib/theme.ts` (RN `boxShadow`): `card`, `raised`, `tabBar`; no grey borders around surfaces.
- Visual direction "Panal" (M13): `deep` hero bands with a faint honeycomb pattern on Bienvenida, Inicio and the hive ficha; white cards over the `canvas`; honey is the one warm accent; press = the target sinks to 97 % (`PressScale`, NativeWind `active:` classes); field controls add a light haptic.
- Targets: field mode ≥ 72 dp high, full width or half width; elsewhere ≥ 56 dp; spacing ≥ 12 dp.
- Primary actions sit in the bottom third (thumb zone). Nothing important in the top corners.
- Bottom tabs: Inicio (`house`), Apiarios (`map-pin`), **Escanear** (center, 72-dp `honey` circle, `scan-qr-code`), Pendientes (`cloud-upload` + count badge), Perfil (`user-round`).

## Field mode (inspection screen)

- Sticky header: apiary › hive name (Plus Jakarta Sans 26), last inspection "hace 12 días", sync chip.
- **Action grid** (2 columns, 96-dp tiles, `honey` background, `deep` icon 36 + label 22): 🎤 Dictar · 📷 Foto · 📝 Nota 1 · 📝 Nota 2 · ➕ Nota · ✅ Terminar.
- Below, structured fields as big controls only: `ScaleField` (1–5, five 64-dp circles), `TriStateField` (Sí / No / No revisado, three 72-dp segments), `StepperField` (− value +, 72-dp buttons), `ChipSelect` (64-dp chips, wraps), never a dropdown or a keyboard unless the user taps "Escribir".
- Every tap gives haptic feedback (`expo-haptics` light); saving gives success haptic + "Guardado en este dispositivo" toast for 3 s with "Deshacer".
- Screen stays awake (`expo-keep-awake`) while field mode is open.
- Drafts autosave every change; leaving and coming back resumes the draft.

## Components

`src/components/ui/`: `Button`, `IconButton` (≥ 56 dp, with `accessibilityLabel`), `TextField`, `Card`, `ListItem`, `Badge`, `SyncChip`, `EmptyState`, `ErrorState`, `Toast` (with undo), `Sheet` (bottom sheet), `Screen` (safe area + padding).
`src/components/field/`: `ActionTile`, `ActionGrid`, `ScaleField`, `TriStateField`, `StepperField`, `ChipSelect`, `DictationSheet`, `ShutterButton` (96-dp), `FieldHeader`.

## Standing rules

1. Tokens only (NativeWind classes from `tailwind.config`); no inline hex outside the theme file.
2. Every screen has loading, empty and error states, and works offline with the data already on the phone.
3. Dates `es-CO`, relative for < 7 days; units: kg, l, °C.
4. Accessibility: every icon-only control has `accessibilityLabel`; contrast ≥ 7:1 for field text; TalkBack reads field values.
5. Copy short, Spanish, concrete ("Guardado en este dispositivo", not "Operación exitosa").
