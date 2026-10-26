# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-26

### Added

- Expo SDK 58 app with Expo Router, strict TypeScript, Biome and jest-expo; NativeWind 4 + Tailwind 3 with the `DESIGN.md` tokens (`docs/superpowers/audits/2026-10-25-nativewind-choice.md`).
- Plus Jakarta Sans and Inter, light theme only.
- Five tabs (Inicio, Apiarios, Escanear in the center, Pendientes, Perfil) with placeholder screens.
- Design-system components (`src/components/ui/`) and field-mode components with haptics (`src/components/field/`), shown in the dev-only gallery (Perfil → Galería de componentes).
- Spanish (es-CO) formatting and the labels of every enum in `../beekeeper/docs/api.md`, plus the 1–5 scale words.
- EAS profiles `development` and `preview` (APK), GitHub Actions CI, placeholder icon.
- Release workflow (same as `beekeeper`): on every push to `main`, if `package.json`'s version has no tag and `CHANGELOG.md` has its section, it tags `vX.Y.Z` and publishes a GitHub release with that section as notes.
