# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Mandatory workflow (see AGENTS.md):** read `DESIGN.md`, the `frontend-design` skill and `../beekeeper/docs/api.md` → spec → plan → wait for Iván's explicit OK → implement. Never implement in the same turn the plan is written. Modules go in the order of `docs/ROADMAP.md`; this repo starts after the backend phase of `beekeeper` is done.

**Never run tests or checks.** Iván runs them, always (2026-10-26). Do not run `pnpm test`, `pnpm typecheck`, `pnpm ci:check`, jest or any test command, not even the test just written. Write the code and the tests, commit each task, and at the end hand Iván the exact one-line command to run; he pastes back whatever fails.

**Never start dev servers or long-running processes.** Iván starts them (2026-10-26): no `pnpm --filter admin dev`, `vite`, `supabase start`/`pnpm db:start` or background shells. Hand him the command; for a browser check, ask him to start the server. One-shot commands that apply or inspect state (`pnpm db:migrate`, `pnpm db:reset`, `pnpm db:types`, git) are fine.

## Project

Landak Apiario Android app: offline-first hive management. Flow: scan a hive's QR → see its history → dictate or tap the inspection → confirm the proposed fields → saved on the phone → synced to Supabase when there is signal, never lost, never duplicated.

## Stack

Expo (React Native, New Architecture) + TypeScript + Expo Router · NativeWind (Tailwind) · `lucide-react-native` · Plus Jakarta Sans + Inter (`@expo-google-fonts/*`) · `expo-sqlite` (local source of truth) · `@supabase/supabase-js` · `expo-camera` (QR + photos) · `expo-image-manipulator` · `expo-speech-recognition` (on-device Spanish) · Zod · jest-expo · EAS Build (APK) + EAS Update (OTA fixes). Decided in `docs/superpowers/specs/ok-2026-10-25-mobile-01-scaffold-design.md`.

## Architecture

- **SQLite is the source of truth for the UI.** Screens read local tables only; the sync engine (`src/features/sync/`) moves rows between SQLite and Supabase.
- **Outbox:** every local write inserts the row and an outbox entry in one transaction; the pusher upserts by client UUID (idempotent), photos upload file → thumbnail → row.
- **Pull:** per table, `updated_at > cursor`, pages of 500, cursor minus 2 minutes overlap; memberships are reloaded whole.
- **Roles in the UI mirror RLS** (`owner` / `reviewer`); hiding a button is convenience, the server decides.
