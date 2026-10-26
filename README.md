# beekeeper-mobile

App Android de Landak Apiario: manejo de colmenas sin señal (Expo + React Native + TypeScript). Backend y contrato de la API: repo hermano `beekeeper` (`../beekeeper/docs/api.md`). Reglas para agentes: `AGENTS.md`; diseño: `DESIGN.md`; orden de módulos: `docs/ROADMAP.md`.

## Requisitos

- Node 22 (`.nvmrc`) y pnpm 12 (`corepack enable`).
- Un teléfono Android con el modo desarrollador y la depuración USB activos, o un emulador.
- Para compilar en el Mac: Android Studio (SDK + JDK 17). Sin Android Studio: compilar en la nube con EAS (abajo).

## Correr la app

```bash
pnpm install
pnpm android        # compila la app de desarrollo, la instala en el teléfono por USB y abre Metro
pnpm start          # solo Metro, cuando la app de desarrollo ya está instalada
```

La galería de componentes está en Perfil → **Galería de componentes** (solo en desarrollo).

## APK de desarrollo sin Android Studio

```bash
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest build -p android --profile development          # en la nube
pnpm dlx eas-cli@latest build -p android --profile development --local  # en el Mac
```

Se instala el APK en el teléfono y luego `pnpm start`. El perfil `preview` produce un APK sin herramientas de desarrollo.

## Revisiones

```bash
pnpm ci:check   # Biome + TypeScript + Jest (también corre en GitHub Actions)
```
