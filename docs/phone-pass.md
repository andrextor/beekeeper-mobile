# Hoja de pruebas en el teléfono (M2 pasos 8–9, M3 en adelante)

Iván runs it once, when the modules are done (2026-10-26): one development build with every native module (sqlite, network, location, datetimepicker, camera, print, sharing, speech recognition, image picker and manipulator, file system), then each module's "How Iván tests it" in one sitting. Each new module adds its row here. The full steps live in each plan (`docs/superpowers/plans/ok-2026-10-25-mobile-0N-*.md`); this list is the order and the essentials.

## Before

1. `beekeeper`: local stack running and seeded (`pnpm db:reset`); admin panel (`pnpm --filter admin dev`) for M2 step 8–9.
2. Phone and Mac on the same Wi-Fi; `.env` points at the Mac's IP (`http://192.168.80.51:54321` today).
3. Build from `main` once every module is merged (about 10 min, arm64 only): `npx eas-cli@latest build -p android --profile development`; install the APK over the previous one (same package, versionCode 2 or higher).
4. `pnpm start`, scan the QR with the dev client.
5. Phone settings: download the Spanish offline voice pack (Google › Voz › Reconocimiento sin conexión), or use the app's **Descargar** in M8.

## Orden

Cada prueba dice qué haces (➜) y qué debe pasar (✓). Marca `[x]` lo que funcione; si algo falla, anota el número del paso y pega lo que dice la pantalla: se arregla en `fix/phone-pass`.

**Herramientas en el Mac**
- **Studio** (ver las tablas del servidor): `http://127.0.0.1:54323` → Table Editor.
- **Admin web**: en `../beekeeper`, `pnpm --filter admin dev` → `http://localhost:5173`, entra con `admin@landak.test`.
- **Usuarios de prueba** (contraseña `landak-2026`): `owner@landak.test` (propietario de Finca Landak), `reviewer@landak.test` (revisor de Finca Landak), `other@landak.test` (propietario de "Apiario Ajeno").
- **Cambiar de usuario** con un solo teléfono: Perfil → Cerrar sesión → entra con el otro. Cerrar sesión borra los datos locales: hazlo solo cuando no haya nada en Pendientes.
- **Matar la app**: botón de apps recientes → deslizar la app fuera. Abrirla de nuevo la reconecta a Metro.

### 1. Cuentas (M2)
- [ ] 1.1 ➜ Admin web → crea `nuevo2@landak.test` con la finca "Finca Nueva". En el teléfono: **Ya tengo cuenta** → entra. ✓ Llegas a Inicio de "Finca Nueva"; en Perfil dice Propietario.
- [ ] 1.2 ➜ Admin → **Desactivar** esa cuenta → en el teléfono, cierra sesión e intenta entrar. ✓ "Esta cuenta está desactivada."
- [ ] 1.3 ➜ Admin → **Reactivar** → entra de nuevo. ✓ Entra.
- [ ] 1.4 ➜ Cierra sesión → **Crear cuenta** con un correo nuevo → **Crear mi finca**. ✓ Quedas como Propietario de esa finca.

### 2. Sincronización (M3) — con `owner@landak.test`
- [ ] 2.1 ➜ Pestaña Pendientes. ✓ "Sincronizado".
- [ ] 2.2 ➜ Activa **modo avión** → crea un apiario y una colmena (Apiarios → +). ✓ Cada guardado dice "Guardado en este dispositivo"; Pendientes muestra "Sin conexión — 2 guardados…".
- [ ] 2.3 ➜ Mata la app y ábrela (sigue en modo avión). ✓ El apiario y la colmena siguen ahí.
- [ ] 2.4 ➜ Quita el modo avión. ✓ Pendientes vuelve a "Sincronizado"; en Studio (`apiaries`, `hives`) aparecen **una sola vez**.
- [ ] 2.5 ➜ Perfil → Galería de componentes → panel de sincronización → **Forzar error** → crea algo. ✓ Pendientes muestra "Intento 1…". Apaga el error → ✓ se sincroniza.
- [ ] 2.6 ➜ En Studio, borra tu fila de `organization_members` de una finca → espera la próxima sincronización (o Pendientes → Sincronizar ahora). ✓ Esa finca y sus datos desaparecen del teléfono.

### 3. Apiarios y colmenas (M4) — owner, con guantes si puedes
- [ ] 3.1 ➜ Apiarios. ✓ Están "Vallecito 1" y "La Loma".
- [ ] 3.2 ➜ Modo avión → nuevo apiario → **Usar mi ubicación** → **niega** el permiso. ✓ Mensaje claro, el formulario sigue usable. Repite y **permite**. ✓ Llena las coordenadas. Con la ubicación del teléfono apagada ✓ Android pide activarla.
- [ ] 3.3 ➜ Nueva colmena: usa los botones − / +, los chips, y pon año de reina. ✓ Sugiere el color de la reina.
- [ ] 3.4 ➜ Intenta borrar un apiario que tiene colmenas. ✓ No te deja.
- [ ] 3.5 ➜ Modo avión → crea una colmena con un nombre que ya existe en ese apiario → quita el modo avión. ✓ Pendientes: "Requiere atención" → **Revisar** → renómbrala → ✓ se sincroniza.
- [ ] 3.6 ➜ Entra como `reviewer@landak.test`. ✓ No hay botones de crear/editar apiarios ni colmenas.

### 4. QR (M5) — owner
- [ ] 4.1 ➜ Colmena C-01 → **Etiqueta QR** → Compartir PDF. ✓ Se abre el menú de compartir con el PDF.
- [ ] 4.2 ➜ Apiario Vallecito 1 → **Imprimir etiquetas**. ✓ Vista de impresión A4 con las etiquetas.
- [ ] 4.3 ➜ Botón central **Escanear** → apunta a una etiqueta (impresa o en la pantalla del Mac), también en modo avión. ✓ Abre esa colmena. Prueba **Linterna**.
- [ ] 4.4 ➜ **Escribir código** → escribe el código con la letra O en vez del cero. ✓ La encuentra igual.
- [ ] 4.5 ➜ Con la cámara normal del teléfono, apunta a la etiqueta. ✓ Ofrece abrir Landak Apiario en esa colmena.
- [ ] 4.6 ➜ Colmena → **Cambiar etiqueta** → escanea una nueva → escanea la vieja. ✓ "no está asignado".
- [ ] 4.7 ➜ Escanea el QR de cualquier página web. ✓ "no es de Landak Apiario".

### 5. Ficha e historial (M6) — owner
- [ ] 5.1 ➜ Abre C-01. ✓ Tarjeta de atención arriba, "Última revisión hace … · por …", botón **Nueva revisión** abajo.
- [ ] 5.2 ➜ Baja por el historial. ✓ Lo más nuevo primero; las notas van dentro de su revisión; al final **Cargar más**.
- [ ] 5.3 ➜ Modo avión, mata la app, ábrela. ✓ Se ve igual.
- [ ] 5.4 ➜ Inicio. ✓ Secciones "Para revisar", "Tareas" (ej. Alimentar) y "Última actividad".

### 6. Revisión en campo (M7) — modo avión, con guantes
- [ ] 6.1 ➜ C-01 → **Nueva revisión** → llena cada sección solo con toques. Toca otra vez un chip elegido. ✓ Se desmarca.
- [ ] 6.2 ➜ Varroa: lavado con 300 abejas y 7 ácaros. ✓ "Carga: 2,3 %". Agrega una nota.
- [ ] 6.3 ➜ Bloquea el teléfono 30 s, mata la app, ábrela. ✓ "Continuando la revisión…" con todo lo que llenaste.
- [ ] 6.4 ➜ **Terminar**. ✓ "Guardado…" con **Deshacer** → tócalo → ✓ vuelves a la revisión con los datos → Terminar otra vez.
- [ ] 6.5 ➜ Quita el modo avión. ✓ En Studio: una fila en `inspections` y una en `notes`.
- [ ] 6.6 ➜ Como reviewer. ✓ Solo puede editar sus propias revisiones.

### 7. Voz (M8)
- [ ] 7.0 ➜ Ajustes del teléfono → Google → Voz → Reconocimiento sin conexión → descarga Español.
- [ ] 7.1 ➜ Modo avión → Nueva revisión → **Dictar** → di: "La reina no se vio, hay buena postura, tres cuadros de cría, reservas bajas. Alimentar y revisar en ocho días." ✓ Aparecen ~7 propuestas.
- [ ] 7.2 ➜ Quita una, cambia otra, **Aceptar todo** → Terminar → sin modo avión. ✓ En Studio, la revisión tiene `source = voice` y el texto dictado.
- [ ] 7.3 ➜ Dicta dentro de una nota. ✓ El texto queda en la nota.
- [ ] 7.4 ➜ Sin el paquete de voz y sin conexión → Dictar. ✓ Aviso antes de escuchar.
- [ ] 7.5 ➜ Niega el micrófono. ✓ Mensaje claro; los toques siguen funcionando.
- [ ] 7.6 ➜ En C-01 di "Colmena 12…". ✓ Advierte que no es esta colmena.

### 8. Fotos (M9)
- [ ] 8.1 ➜ Revisión → **Foto** → permite la cámara → 3 fotos con guantes → quita una de la tira → **Deshacer** → **Listo**. ✓ Quedan 3.
- [ ] 8.2 ➜ Modo avión: 2 fotos más. ✓ Se guardan.
- [ ] 8.3 ➜ Con datos móviles (Wi-Fi apagado). ✓ Los datos se sincronizan, las fotos dicen "esperando Wi-Fi" → Pendientes → **Subir ahora con datos** → ✓ suben.
- [ ] 8.4 ➜ Mata la app mientras sube. ✓ Al abrir, sigue. En Studio → Storage: cada foto tiene `.jpg` y `.thumb.jpg`.
- [ ] 8.5 ➜ Admin web. ✓ Muestra las fotos. Como reviewer ✓ ve miniatura y luego la foto completa.
- [ ] 8.6 ➜ Borra una foto → Deshacer ✓ sigue. Bórrala otra vez ✓ desaparece del historial.

### 9. Actividades (M10) — owner, modo avión
- [ ] 9.1 ➜ C-01 → **Registrar actividad** → Alimentación, Jarabe, 2 l, 1:1. ✓ Historial: "Alimentación · Jarabe de azúcar 1:1 · 2 l".
- [ ] 9.2 ➜ Cambio de reina, año 2026. ✓ Sugiere "Blanco"; la colmena muestra la reina nueva.
- [ ] 9.3 ➜ Traslado → La Loma. ✓ C-01 aparece en La Loma.
- [ ] 9.4 ➜ División → **Crear la nueva colmena ahora**. ✓ Formulario prellenado; la actividad queda enlazada a la colmena nueva.
- [ ] 9.5 ➜ Quita el modo avión. ✓ Studio: filas en `events` y `hives` actualizadas.
- [ ] 9.6 ➜ Como reviewer: Pérdida en C-02. ✓ "Avisa al propietario…"; C-02 sigue Activa.
- [ ] 9.7 ➜ En una revisión: **Actividad** → Tratamiento → Terminar. ✓ Queda dentro de la revisión. Deshacer ✓ la colmena vuelve como estaba.
- [ ] 9.8 ➜ Toca una actividad → edítala → bórrala → Deshacer. ✓ Vuelve.

### 10. Personas e invitaciones (M11) — owner con conexión
- [ ] 10.1 ➜ Perfil → **Personas de la finca** → **Invitar persona** → "Ayudante", Revisor. ✓ Muestra el código → Compartir por WhatsApp (a ti mismo). Anota el código.
- [ ] 10.2 ➜ Cierra sesión → Crear cuenta nueva → **Tengo un código** → escribe el código. ✓ Entras a Finca Landak como Revisor, sin "Invitar persona".
- [ ] 10.3 ➜ Otra cuenta nueva con el mismo código. ✓ "El código no es válido…".
- [ ] 10.4 ➜ Como owner: Personas → Ayudante → **Hacer propietario**. ✓ Al entrar como Ayudante (tras sincronizar) tiene botones de propietario. Devuélvelo a Revisor.
- [ ] 10.5 ➜ En una finca donde eres el único propietario → **Salir de esta finca**. ✓ "La finca debe tener al menos un propietario".
- [ ] 10.6 ➜ Modo avión → Personas. ✓ "Sin conexión"; sin modo avión → **Intentar de nuevo** ✓ carga.
- [ ] 10.7 ➜ Como Ayudante: revisión en modo avión → Salir de esta finca. ✓ Avisa cuántos registros sin sincronizar → **Sincronizar primero** → luego Salir ✓ la finca y sus fotos desaparecen.
- [ ] 10.8 ➜ Crea otro código → **Cancelar código** → úsalo en una cuenta. ✓ No sirve.
- [ ] 10.9 ➜ Admin web: cambia el rol / quita / desactiva al Ayudante. ✓ El teléfono lo refleja tras sincronizar; Personas muestra "Desactivado".
### 11. Rediseño Panal (M13)
- [ ] 11.1 ➜ Perfil → Galería de componentes. ✓ Botones píldora (verde, miel, tonal, rojo, "Cancelar" solo texto); al tocarlos se hunden y rebotan. Campos rellenos con la etiqueta adentro; el de error tiene borde rojo e ícono. Avisos rojo, miel y verde con ícono.
- [ ] 11.2 ➜ Cierra sesión. ✓ Bienvenida oscura con el panal; **Iniciar sesión** es el botón; "¿No tienes cuenta? Crear cuenta" es un enlace.
- [ ] 11.3 ➜ Crear cuenta → contraseña de 5 caracteres → toca el siguiente campo. ✓ "La contraseña debe tener al menos 8 caracteres." con ícono; al completar 8 se quita sola.
- [ ] 11.4 ➜ Inicio, Apiarios, una colmena, Perfil, Pendientes. ✓ No quedan cajas con borde gris; Inicio y la colmena abren con la banda oscura; la barra de abajo marca la pestaña con una pastilla verde.
- [ ] 11.5 ➜ Al sol, a un brazo de distancia, con guantes: Inicio, una colmena y una revisión. ✓ Todo se lee y cada botón responde.
- [ ] 11.6 ➜ Nueva revisión. ✓ Misma distribución y tamaños de antes; solo cambian las formas.
- [ ] 11.7 ➜ Ajustes → tamaño de letra al máximo. ✓ Nada se corta.

## Pilot checklist (overview §10)

Filled with the first preview APK against D1 (`docs/release.md`), not the dev build. Every row needs evidence: a date, a screenshot, a row count.

| Item | How | Result |
|------|-----|--------|
| APK installs and opens without a computer | WhatsApp link on a phone that never had the dev build, following `docs/install.md` | |
| Sign in, create a finca, an apiary, a hive | Once with a self-created account, once with an account created by the admin | |
| Two fincas cannot see each other | Two phones, two accounts, two fincas | |
| A printed QR opens the right hive | 3 labels printed, scanned in the apiary | |
| Manual inspection usable, history visible | On site, gloves | |
| Airplane-mode inspection survives closing the app | Record, force-stop, reopen | |
| Syncs once when signal returns | Studio row count before and after; Pendientes empty | |
| Network cut mid-sync: no loss, no duplicate | Airplane on/off during a sync 5 times; count rows by id | |
| Voice with confirmation, or a clear fallback | Including the offline pack missing | |
| The user sees what is synced or pending | Pendientes tab and sync chips | |
| Camera, microphone, location permissions | Fresh install: deny, then allow each | |
| Update without losing data | 3 unsynced inspections, next APK installed over it, then they sync once; an OTA shows "Hay una actualización" | |
| Install guide works for someone else | A beekeeper follows `docs/install.md` alone | |
