# Publicar una versión (Iván)

El APK se publica en el repo público `andrextor/beekeeper-releases` (solo releases, sin código). El enlace estable siempre apunta al último:
https://github.com/andrextor/beekeeper-releases/releases/latest/download/landak-apiario.apk

## Una vez

- [ ] `brew install gh && gh auth login`.
- [ ] Crear el repo público: `gh repo create andrextor/beekeeper-releases --public --description "Landak Apiario APK releases"`.
- [ ] En `eas.json` (perfiles `preview` y `production`) reemplazar `PASTE_SB_PUBLISHABLE_KEY` por la publishable key de D1 (Dashboard → Project Settings → API Keys, `sb_publishable_…`). No es secreta: va dentro de cada APK. Nunca la secret key.
- [ ] Build local: JDK 17 y Android SDK (`ANDROID_HOME`). Si no, `pnpm release:apk --cloud` usa la cuota gratis de EAS.
- [ ] **Después del primer build:** `npx eas-cli@latest credentials` → Android → preview → descargar el keystore y guardar archivo + contraseñas en el gestor de contraseñas. Si se pierde, cada apicultor tendría que desinstalar (y perder lo no sincronizado) para instalar la siguiente versión.

## Cada versión nueva (APK)

Hace falta un APK nuevo cuando cambia algo nativo (un módulo de Expo nuevo, un permiso, una versión del SDK) y, por regla, cuando hay una migración de la base local. El runtime de las actualizaciones es la huella (`fingerprint`) de lo nativo: subir `version` o `versionCode` no lo cambia, un módulo nativo sí.

- [ ] Rama con el cambio y su `chore(release): x.y.z`: `package.json` y `app.json` con la misma versión, `android.versionCode` + 1, sección `## [x.y.z]` en `CHANGELOG.md`.
- [ ] Si hay migración nueva: su hash en `src/db/migrations.test.ts` (el test de actualización desde la versión 1 la cubre sola).
- [ ] `pnpm ci:check`, merge a `main`.
- [ ] En `main`: `pnpm release:apk` (o `--cloud`). Construye, escribe `latest.json` y crea el release `vx.y.z` con las notas del CHANGELOG.
- [ ] Instalar el APK **encima** de la versión anterior en un teléfono con registros sin sincronizar (modo avión) → siguen ahí → quitar modo avión → se sincronizan una sola vez.
- [ ] Compartir el enlace estable. Las apps instaladas muestran "Hay una nueva versión de la app" en Inicio.

## Arreglo solo de JavaScript (OTA)

Solo si no cambia nada nativo ni la base local (una migración nunca va por OTA: si la app vuelve al bundle del APK tras un fallo, ese código viejo se encontraría con un esquema nuevo).

- [ ] Mismo flujo de siempre: rama, `chore(release): x.y.z` de parche, `pnpm ci:check`, merge. No hace falta subir `versionCode`: no hay APK.
- [ ] En `main`: `npx eas-cli@latest update --channel preview --message "x.y.z: qué arregla"`. Si EAS dice que no hay builds con ese runtime, el cambio tocó algo nativo: va como APK.
- [ ] En un teléfono: Inicio → "Hay una actualización" → Reiniciar ahora → el arreglo se ve.
