# Hoja de pruebas en el teléfono (M2 pasos 8–9, M3 en adelante)

Iván runs it once, when the modules are done (2026-10-26): one development build with every native module (sqlite, network, location, datetimepicker, camera, print, sharing, speech recognition, image picker and manipulator, file system), then each module's "How Iván tests it" in one sitting. Each new module adds its row here. The full steps live in each plan (`docs/superpowers/plans/ok-2026-10-25-mobile-0N-*.md`); this list is the order and the essentials.

## Before

1. `beekeeper`: local stack running and seeded (`pnpm db:reset`); admin panel (`pnpm --filter admin dev`) for M2 step 8–9.
2. Phone and Mac on the same Wi-Fi; `.env` points at the Mac's IP (`http://192.168.80.51:54321` today).
3. Build from `main` once every module is merged (about 10 min, arm64 only): `npx eas-cli@latest build -p android --profile development`; install the APK over the previous one (same package, versionCode 2 or higher).
4. `pnpm start`, scan the QR with the dev client.
5. Phone settings: download the Spanish offline voice pack (Google › Voz › Reconocimiento sin conexión), or use the app's **Descargar** in M8.

## Order

| # | Module | Essentials (gloves on where it says so) |
|---|--------|-----------------------------------------|
| 1 | M2 · 8–9 | Admin creates `nuevo2@landak.test` with "Finca Nueva" → sign in, lands as Propietario. Desactivar → "Esta cuenta está desactivada."; Reactivar → works. |
| 2 | M3 | Sign in as owner → Pendientes "Sincronizado", cursors in Perfil → Galería de componentes. Airplane mode → create an apiary and a hive (M4 forms) → "Sin conexión — 2 guardados…"; kill and reopen → still there; airplane off → synced once (Studio). Forzar error → "Intento 1…" → off → syncs. Second finca via invite → its rows appear; delete the membership in Studio → purged. |
| 3 | M4 | Apiarios lists the seed; airplane mode, gloves: new apiary with **Usar mi ubicación** (deny once, then allow; turn location off → Android's dialog), new hive with steppers, chips, queen year → colour suggested. Delete an apiary with hives → blocked. Reviewer: no edit buttons. Duplicate hive name offline → Requiere atención → **Revisar** → rename → syncs. |
| 4 | M5 | Hive → Etiqueta QR → Compartir PDF; apiary → Imprimir etiquetas (A4). Print one, scan it from the center tab (also in airplane mode), Linterna, Escribir código with O for 0. System camera on the label → opens the app on the hive. Cambiar etiqueta → old label says "no está asignado". Random website QR → "no es de Landak Apiario". |
| 5 | M6 | C-01: attention card, last inspection "hace … · por …", Nueva revisión at the bottom. History newest first, notes inside inspections, Cargar más. Airplane mode, kill, reopen → same. Inicio: Para revisar, Tareas (Alimentar), Última actividad. |
| 6 | M7 | Airplane mode, gloves: Nueva revisión → every section by taps; tap a chosen chip again → cleared; varroa wash 300 / 7 → "Carga: 2,3 %"; Nota 1. Lock 30 s, kill, reopen → "Continuando la revisión…". Terminar → "Guardado…" → Deshacer → back with the data → Terminar → airplane off → one inspection and one note in Studio. Reviewer: edit only own inspections. |
| 7 | M8 | Airplane mode with the voice pack: Dictar → "La reina no se vio, hay buena postura, tres cuadros de cría, reservas bajas. Alimentar y revisar en ocho días." → 7 proposals → Quitar one, Cambiar one, Aceptar todo → Terminar → Studio `source = voice`, transcript as said. Dictar inside a note. Without the pack offline → banner before listening. Deny microphone → message, taps still work. "Colmena 12…" on C-01 → warning. |
| 8 | M9 | Field mode → Foto → allow → 3 shots with gloves → remove one from the strip → Deshacer → Listo. Airplane mode: 2 more. Mobile data: photos wait ("esperando Wi-Fi"), rows sync → Subir ahora con datos. Kill mid-upload → resumes; Storage has one `.jpg` + `.thumb.jpg` each. Admin shows them. Second phone as reviewer → thumbnails then full image. Delete → Deshacer → stays; delete again → gone from the timeline, still in Storage. |

| 9 | M10 | Owner, airplane mode: C-01 → Registrar actividad → Alimentación, Jarabe, 2 l, 1:1 → history "Alimentación · Jarabe de azúcar 1:1 · 2 l". Cambio de reina 2026 → colour "Blanco" suggested → the hive shows the new queen. Traslado → La Loma → C-01 listed under La Loma. División → Crear la nueva colmena ahora → prefilled form → the event links the new hive. Airplane off → Studio has the events and updated `hives`. Reviewer: Pérdida on C-02 → "Avisa al propietario…", C-02 stays Activa. Field mode → Actividad → Tratamiento → Terminar → linked to the inspection; Deshacer → the hive goes back. Tap an event → edit; delete → Deshacer. |

Anything that fails: note the step and paste what the screen says; it becomes a fix branch.
