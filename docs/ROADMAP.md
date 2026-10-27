# Roadmap — beekeeper-mobile

Starts when the backend phase of `beekeeper` (B1–B6) is done; it can use the local Supabase stack before D1 exists. One module per spec + plan + branch; Iván tests each on a real Android phone before the next.

| # | Module | Spec / plan slug | Backend used | Version |
|---|--------|------------------|--------------|---------|
| M1 | Scaffold + design system (Expo, Router, NativeWind, Lucide, fonts, tokens, components, dev build) | `mobile-01-scaffold` | — | 0.1.0 |
| M2 | Sign-up / sign-in (email + password), onboarding (create organization or join with a code), organization switcher | `mobile-02-auth-onboarding` | B2 | 0.2.0 |
| M3 | Local database + sync engine (SQLite schema, migrations, outbox, pull, status, Pendientes tab) | `mobile-03-local-db-sync` | B1 conventions, B2–B4 | 0.3.0 |
| M4 | Apiaries and hives (lists, create/edit for owners, hive facts) | `mobile-04-apiaries-hives` | B3 | 0.4.0 |
| M5 | QR: generate, print/share labels, scan → hive, re-label | `mobile-05-qr` | B3 | 0.5.0 |
| M6 | Hive detail and timeline | `mobile-06-hive-timeline` | B3, B4 | 0.6.0 |
| M7 | Inspection field mode (manual), quick notes | `mobile-07-field-inspection` | B4 | 0.7.0 |
| M8 | Voice dictation + Spanish field parser + confirmation | `mobile-08-voice` | B4 | 0.8.0 |
| M9 | Photos: capture, resize, thumbnail, queue, upload, view | `mobile-09-photos` | B5 | 0.9.0 |
| M10 | Events: feeding, treatment, harvest, queen change, split, swarm, merge, transfer, loss | `mobile-10-events` | B4 | 0.10.0 |
| M11 | Members: invite codes for reviewers, roles, leave organization | `mobile-11-members` | B2 | 0.11.0 |
| M12 | APK release, OTA updates, local DB upgrade safety, install guide | `mobile-12-distribution` | D1 | 1.0.0 |
| M13 | Visual refresh "Panal" (tokens, components, hero bands, tab bar) | `mobile-13-visual-refresh` (2026-10-26) | — | 1.1.0 |
| M14 | Read-only role "Observador" (`viewer`): parse, label, hidden writes, three-role pickers | `mobile-14-viewer-role` (2026-10-26) | B8 | 1.2.0 |
| M15 | Panal on every screen (hero band everywhere outside field mode, app icon and splash) | `mobile-15-panal-everywhere` (2026-10-26) | — | 1.3.0 |

Specs: `docs/superpowers/specs/[ok-]2026-10-25-<slug>-design.md` · Plans: `docs/superpowers/plans/[ok-]2026-10-25-<slug>.md` (`ok-` once approved).

Pilot definition of done = overview §10 checklist (`../beekeeper/docs/landak-apiario-overview.md`), verified at M12.
