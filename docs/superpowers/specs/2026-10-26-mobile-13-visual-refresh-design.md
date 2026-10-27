# M13 · Visual refresh — spec

Status: **draft**, waiting for Iván's OK. Branch: `feat/m13-visual-refresh` (from `fix/phone-pass`).

## Problem

Iván, 2026-10-26: "la aplicación parece una aplicación hecha en los 2000 con Bootstrap". The look comes from a few concrete choices, all in `src/components/` and the tokens:

- every surface is a white box with a 1–2 px grey border (`border-2 border-border`), radius 14–16;
- buttons are flat rectangles; the secondary one is a grey-bordered white box;
- inputs are bordered boxes with the label floating above, errors are a line of red text;
- the background is a flat `stone-50` everywhere, no hierarchy between header and content;
- titles are repeated by hand in 28 screens (`font-display text-title`), all the same weight and place;
- nothing moves: presses only dim (`active:opacity-80`).

## Direction: "Panal" (honeycomb)

Grounded in the beekeeper's world, not a generic template: the deep teal of the brand as the frame of the app, honey as the one warm accent, wax-white surfaces, the honeycomb as the only ornament.

References that shaped it:
- **Material 3 Expressive** (Android 16): tonal surfaces instead of borders, larger and more varied corner radii, pill buttons, spring motion on press, a filled navigation indicator.
- **Field apps (AllTrails, Strava, Gaia)**: contrast decides readability in sun; dark header bands with light content, never thin grey text.
- **Form guidance** (UXPin, Material): label always visible, error under the field with an icon (never color alone), validate on blur.

### Tokens (shared with the admin: `../beekeeper/DESIGN.md` gets the same values in a separate spec)

| New token | Value | Use | Contrast |
|-----------|-------|-----|----------|
| `canvas` | `#f6f5f0` | Screen background behind cards | deep on it 12.9:1 |
| `fill` | `stone-100 #f2f1ec` | Input and segmented-control fill | deep 12.5, muted 8.2 |
| `primary-soft` / `on-primary-soft` | `#e7f4e4` / `#0a5410` | Tonal (secondary) buttons, success | 8.1:1 |
| `accent-soft` | `#fff1d6` | Pending, honey callouts | deep 12.6 |
| `danger-soft` / `on-danger-soft` | `#fdecea` / `#8a1c12` | Error callouts and field errors | 8.1:1 |
| `mist` | `#a9c7cc` | Secondary text on `deep` | 7.9:1 |
| radius `field` / `card` / `sheet` / `pill` | 16 / 24 / 28 / 999 | Inputs / cards / sheets / buttons and chips | — |
| shadow `card` | y 2, blur 12, deep at 6 % | Cards float on `canvas` instead of borders | — |

Unchanged: brand colors, fonts (Plus Jakarta Sans + Inter), sizes, field-mode rules (white background, ≥ 72 dp, ≥ 7:1).

### Components

- **Button**: pill (radius 999), 56 dp (field 72 dp), press = spring scale 0.97 (Reanimated, already installed) + light haptic. Variants: `primary` (leaf), `accent` (honey), `tonal` (replaces the grey `secondary`: `primary-soft` + `on-primary-soft`), `ghost` (text only, for "Cancelar"), `danger`.
- **TextField**: filled container (`fill`, radius 16, no border at rest), label inside on top in caption semibold, value in body; focus = white fill + 2 dp `primary` ring; error = `danger-soft` ring + `circle-alert` icon + message below in `on-danger-soft`. Validates on blur, the message clears as soon as the value is fixed.
- **Callout** (replaces `FormError`'s bare red line; same API + `tone`): rounded 16 box, tinted background, icon, title-weight text. Tones `danger`, `accent` (pending/offline), `primary` (success). Keeps `accessibilityRole="alert"`.
- **Card**: no border, `surface` on `canvas`, radius 24, `card` shadow. `Card` with `onPress` gets the spring press.
- **ListItem / grouped list**: rows inside one card, hairline separators inset from the icon, icon inside a 40 dp tonal squircle (`primary-soft`).
- **Badge / SyncChip**: tonal pills (soft background + darker ink), never solid fills except `danger`.
- **Toast**: dark snackbar (`deep` background, white text, honey "Deshacer"), slides up with a spring; 14:1 contrast in sun.
- **Sheet**: radius 28 top corners, grab handle, `canvas` background.
- **EmptyState / ErrorState / NotAvailable**: icon on a large honeycomb-cell shape in `primary-soft` (or `danger-soft`), title + body + one action.
- **Title** (new; the 28 hand-made titles become one component): large title 30/36 Plus Jakarta Sans, optional eyebrow (finca name) and trailing action.
- **Tab bar**: white, top shadow instead of a border line, active tab = `primary-soft` pill behind the icon (M3 indicator), scan button stays the honey circle, raised with a shadow.
- **Screen**: `canvas` background; optional `hero` header band in `deep` with a faint honeycomb pattern (SVG, 6 % opacity) for Inicio, Bienvenida and the hive ficha; content cards overlap the band by 24 dp.

### Screens touched beyond the components

Bienvenida (hero band + honeycomb mark; one primary button **Iniciar sesión** at the thumb zone and "¿No tienes cuenta? **Crear cuenta**" as a link below it, ≥ 48 dp tap area: most people arrive with an account made by the admin or are told to create one with an invite; Iván, 2026-10-26), Empecemos (two choice cards with tonal icons), Inicio (hero band with greeting + finca, sync state on the band), hive ficha (band with hive name, apiary, queen dot), Perfil (grouped lists). Field mode keeps its layout; only the shared components change shape.

## Rejected

- **Dark mode / dark-first UI**: better at night, worse through a veil in midday sun; stays a later spec.
- **Liquid glass / blur surfaces**: low contrast in sun, and blur is costly on low-end Android.
- **A UI kit (Tamagui, gluestack, Paper)**: a new dependency and a second styling system next to NativeWind; the existing 20 components are the kit.
- **New fonts**: the admin shares them; changing them is a cross-repo decision for no field gain.

## Field use

Sun: every text pair ≥ 7:1 (table above); errors and states keep icon + word. Gloves: no target shrinks; pills keep 56/72 dp. Veil at arm's length: larger titles, no thin weights, no text on photos. Low-end phones: the only animations are press springs and the toast slide (UI thread, Reanimated); no blur.

## Backend contract used

None.

## Out of scope

Dark mode, admin restyle (its own spec in `beekeeper`), new illustrations beyond the honeycomb pattern and mark, layout changes to field mode.
