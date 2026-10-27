# M15 · Panal on every screen — design

Status: **approved** (Iván, 2026-10-26) · Builds on `ok-2026-10-26-mobile-13-visual-refresh-design.md`

## Problem

M13 gave the dark hero band with the honeycomb only to Bienvenida, Inicio and the hive ficha. Every other screen still opens with the old plain `Title` on a light background:
- Iniciar sesión, Crear cuenta, Tengo un código and Empecemos;
- Apiarios, Pendientes and Perfil;
- the forms and details.

Coming from the dark Bienvenida, Iniciar sesión looks like another app (Iván, 2026-10-26: "esto no se ve como el diseño"). "¿Olvidaste tu contraseña?" is a tonal button that competes with Ingresar, while "Crear cuenta" is already a link.

## Decision

Every screen outside field mode opens with the same hero band. The content rises over the band as a light sheet, as it already does on Inicio and the ficha.

- **`Screen` screens** pass `hero={{ title, eyebrow }}` and drop `<Title>`. `BackButton` stays the first thing in the sheet, as on the ficha.
- **List screens (`FlatList`)** take a new `ListHero` from `Screen.tsx` as their list header. It holds the same band and the same sheet overlap, so the band scrolls with the list. The outer `paddingTop: insets.top` goes, because the band pads the status bar.
- **Eyebrow for context**, so long titles stop wrapping:

  | Screen | Title | Eyebrow |
  |---|---|---|
  | Personas | Personas | the finca |
  | Revisión | Revisión | the hive |
  | Cambiar etiqueta | Cambiar etiqueta | the hive |
  | Event form | the event type | the hive |
  | Apiary | the apiary name | — |
  | Hive form | the form title | — |

- **"¿Olvidaste tu contraseña?" becomes a link.** The second copy of Bienvenida's inline link is the extraction: a `TextLink` in `components/ui/`, used by both screens. Its tap area is ≥ 48 dp.

## Screens

| Kind | Screens |
|---|---|
| Auth | `sign-in`, `sign-up`, `join`, `onboarding` (Empecemos and Crea tu finca) |
| Tabs | `apiaries` (list), `pending` (list), `profile` |
| Finca | `organizations`, `members`, `invite` (both states) |
| Apiaries | `apiary/new`, `apiary/[id]/edit`, `apiary/[id]` (list), `qr/assign` (list) |
| Hive | `hive/new` and `hive/[id]/edit` (through `HiveForm`), `label`, `photos`, `relabel` |
| Records | `inspection/[id]`; `event/new` (picker, then `EventForm`); `event/[eventId]` (through `EventForm`) |

**Not touched:**
- field mode: `inspect`, `ConfirmProposals`, `camera`, `scan`, because its layout stays (DESIGN.md);
- the photo viewer (full-screen black);
- `h/[code]` (a redirect);
- the three screens already done.

`Title` stays only for `ConfirmProposals`.

## Field use

- The band costs about 100 dp of height on top. Forms scroll, so no target gets smaller.
- The dark band with white text reads well in sun.
- The status bar switches to light icons over the band; this is the existing `useLightStatusBar`.

## Alternatives rejected

- **Hero only on the auth screens.** Iván asked for the whole app in one branch.
- **A fixed (non-scrolling) band on lists.** It takes space from the list on small phones. Inicio already scrolls its band.

## Backend contract

None.

## Out of scope

- New colors or components beyond `ListHero` and `TextLink`.
- Field mode.
- Copy changes, apart from the shorter titles above.
