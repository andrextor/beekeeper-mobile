# Hoja de pruebas en el teléfono (M2 pasos 8–9, M3 en adelante)

Una pasada por módulo en la app de desarrollo contra el Supabase local. Los pasos completos de cada módulo están en su plan (`docs/superpowers/plans/ok-*.md`); aquí va el orden y lo esencial.

## Antes de empezar

1. **Supabase local** (en `~/projects/beekeeper`): `pnpm db:start` y, para empezar limpio, `pnpm db:reset`. El reset borra todo lo que hayas creado y vuelve a cargar los datos de prueba.
2. **Admin web** (solo sección 1 y algunos pasos de 8 y 10): en otra terminal, `pnpm --filter admin dev`.
3. **App de desarrollo en el teléfono**: si no está instalada, en el teléfono abre expo.dev → proyecto **landak-apiario** → **Builds** → el último de perfil **development** → **Install**.
4. **Teléfono y Mac en el mismo Wi-Fi**. `.env` apunta a la IP del Mac (`http://192.168.80.51:54321`); si la IP del Mac cambia, cámbiala ahí.
5. **Metro** (en `~/projects/beekeeper-mobile`): `pnpm start --clear` → en el teléfono abre la app de desarrollo y elige el servidor.
6. **Voz** (para la sección 7): Ajustes del teléfono → Google → Voz → Reconocimiento sin conexión → descarga Español.

## Orden

Cada prueba dice **dónde** la haces, qué haces (➜) y qué debe pasar (✓). Marca `[x]` lo que funcione; si algo falla, anota el número del paso y pega lo que dice la pantalla.

**Dónde**
- 📱 **Teléfono**: la app de desarrollo. Casi todo pasa aquí.
- 💻 **Admin**: en el Mac, `http://localhost:5173`, entra con `admin@landak.test`. Para arrancarlo: en `~/projects/beekeeper`, `pnpm --filter admin dev`.
- 🗄️ **Studio**: en el Mac, `http://127.0.0.1:54323` → **Table Editor** → elige la tabla a la izquierda. Sirve para mirar qué llegó al servidor.

**Usuarios de prueba** (contraseña `landak-2026`)
- `owner@landak.test`: propietario de Finca Landak.
- `reviewer@landak.test`: revisor de Finca Landak.
- `other@landak.test`: propietario de "Apiario Ajeno".

**Trucos en el 📱**
- **Cambiar de usuario**: pestaña **Perfil** → **Cerrar sesión** → **Iniciar sesión** con el otro. Cerrar sesión borra los datos del teléfono: hazlo solo con **Pendientes** vacío.
- **Matar la app**: botón de apps recientes (el cuadrado o deslizar desde abajo y sostener) → desliza la app fuera.
- **"Modo avión y Wi-Fi apagado"** (sin conexión): desliza desde arriba → toca el avión **y** toca el Wi-Fi para apagarlo. Arriba no debe quedar el ícono de Wi-Fi. No hay modo avión simulado en la app: es el del teléfono. **Revisa que el Wi-Fi quede apagado**: si alguna vez prendiste el Wi-Fi en modo avión, Android lo vuelve a prender solo, y con Wi-Fi la app sigue llegando al Mac y sincroniza (verás el ícono de Wi-Fi junto al avión).
- **Con la app de desarrollo, apagar el Wi-Fi también corta Metro y el Supabase del Mac.** La app sigue funcionando porque ya cargó, pero **no la recargues** (ni `r` en Metro ni sacudir el teléfono) mientras estés en modo avión: quedaría en blanco. Al quitar el modo avión y prender el Wi-Fi vuelve sola. **No la mates sin Wi-Fi**: la app de desarrollo baja el código desde Metro al abrir y no arrancaría. Los pasos que necesitan eso están al final, en **Con el APK**.

### 1. Cuentas (M2)
- [x] 1.1 💻 Admin → Usuarios → **Nuevo usuario** → Tipo **Apicultor**, correo `nuevo2@landak.test`, una contraseña, finca "Finca Nueva". 📱 **Iniciar sesión** → entra con ese correo. ✓ Llegas a Inicio de "Finca Nueva"; en Perfil dice Propietario.
- [x] 1.2 💻 Admin → Usuarios → `reviewer@landak.test` → **Desactivar** (no uses la cuenta de 1.1: el admin no deja desactivar al único propietario de una finca). 📱 Cierra sesión e intenta entrar con `reviewer@landak.test`. ✓ "Esta cuenta está desactivada."
- [x] 1.3 💻 Admin → `reviewer@landak.test` → **Reactivar**. 📱 Entra de nuevo con `reviewer@landak.test`. ✓ Entra.
- [x] 1.4 📱 Cierra sesión → en la bienvenida toca el enlace **Crear cuenta** → correo nuevo y contraseña de 8 o más → ✓ llegas a **Empecemos** → **Crear mi finca**. ✓ Quedas como Propietario de esa finca.
- [x] 1.5 📱 Crea otra cuenta nueva y en **Empecemos** toca **Cerrar sesión** (abajo). ✓ Pregunta antes de borrar y vuelves a la bienvenida. En Empecemos, el botón atrás de Android cierra la app.

### 2. Sincronización (M3) — 📱 entra como `owner@landak.test`
- [x] 2.1 📱 Abajo, pestaña **Pendientes**. ✓ Arriba dice "Sincronizado".
- [x] 2.2 📱 **Modo avión y Wi-Fi apagado** (arriba no debe quedar el ícono de Wi-Fi) → pestaña **Apiarios** → **Nuevo apiario** → ponle un nombre → **Guardar** → ábrelo → **Nueva colmena** → nombre → **Guardar**. ✓ Cada guardado dice "Guardado en este dispositivo". ➜ Pestaña **Pendientes**. ✓ "Sin conexión — 2 guardados en este dispositivo".
- [x] 2.4 📱 **Prende el Wi-Fi y quita el modo avión** (el Supabase está en tu Mac: solo se llega por el Wi-Fi de la casa, no con datos móviles) → espera unos segundos en **Pendientes**. ✓ "Sincronizado". 🗄️ Studio → tablas `apiaries` y `hives`. ✓ El apiario y la colmena aparecen **una sola vez** cada uno.
- [x] 2.5 📱 **Perfil** → **Galería de componentes** (solo en la app de desarrollo) → sección "Sincronización (pruebas)" → toca **Forzar error** hasta que diga "activado" → crea un apiario. ➜ **Pendientes**. ✓ El registro aparece con "Intento 1 · …". ➜ Vuelve a la galería y déjalo en "apagado". ✓ Se sincroniza.
- [x] 2.6 🗄️ Studio → tabla `organization_members` → **Insert row**: `organization_id` `00000000-0000-4000-b000-000000000002`, `user_id` `00000000-0000-4000-a000-000000000001`, `role` `reviewer` → **Save**. 📱 **Pendientes** → **Sincronizar ahora** → **Perfil** → **Cambiar de finca**. ✓ Aparece "Apiario Ajeno"; al entrar ves "Apiario del vecino" y la colmena V-01.
- [x] 2.7 🗄️ Studio → `organization_members` → borra la fila que agregaste en 2.6. 📱 **Pendientes** → **Sincronizar ahora**. ✓ "Apiario Ajeno" y sus datos desaparecen y vuelves a Finca Landak.

### 3. Apiarios y colmenas (M4) — 📱 como `owner@landak.test`, con guantes si puedes
- [x] 3.1 📱 Pestaña **Apiarios**. ✓ Están "Vallecito 1" y "La Loma".
- [x] 3.2 📱 **Modo avión y Wi-Fi apagado** → **Nuevo apiario** → **Usar mi ubicación** → **niega** el permiso. ✓ Mensaje claro y el formulario sigue usable. ➜ Repite y **permite**. ✓ Llena las coordenadas. ➜ Con la ubicación del teléfono apagada. ✓ Android pide activarla.
- [x] 3.3 📱 Abre un apiario → **Nueva colmena** → usa los botones − / +, los chips y pon el año de la reina. ✓ Sugiere el color de la reina.
- [x] 3.4 📱 Abre un apiario que tenga colmenas → **Editar** → **Eliminar**. ✓ No te deja.
- [ ] 3.5 📱 Abre **Vallecito 1** → **modo avión y Wi-Fi apagado** → **Nueva colmena** con nombre `C-50` → **Guardar** (el formulario no deja repetir un nombre que ya está en el teléfono: el choque tiene que venir de otra persona). 🗄️ Studio → **SQL Editor** → pega y corre (crea `C-50` en el mismo apiario, como si otra persona la hubiera hecho):
  `insert into hives (id, organization_id, apiary_id, name, qr_code, created_by) select gen_random_uuid(), organization_id, apiary_id, 'C-50', 'ZZZZZZZZZ1', created_by from hives where name = 'C-01' and deleted_at is null limit 1;`
  📱 **Prende el Wi-Fi y quita el modo avión** → **Pendientes**. ✓ "Requiere atención" en Colmena C-50 → **Revisar** → cambia el nombre (ej. `C-51`) → **Guardar**. ✓ Se sincroniza.
- [ ] 3.6 📱 Cambia a `reviewer@landak.test` → **Apiarios** y abre uno. ✓ No hay botones para crear ni editar apiarios o colmenas.

### 4. QR (M5) — 📱 como `owner@landak.test`
- [ ] 4.1 📱 Abre la colmena C-01 → **Etiqueta QR** → **Compartir PDF**. ✓ Se abre el menú de compartir con el PDF.
- [ ] 4.2 📱 Abre el apiario Vallecito 1 → **Imprimir etiquetas**. ✓ Vista de impresión A4 con las etiquetas.
- [ ] 4.3 📱 Botón central **Escanear** → apunta a una etiqueta (impresa, o el PDF de 4.1 abierto en la pantalla del Mac); repite con **modo avión y Wi-Fi apagado**. ✓ Abre esa colmena. Prueba **Linterna**.
- [ ] 4.4 📱 **Escanear** → **Escribir código** → escribe el código de la etiqueta con la letra O en vez del cero. ✓ La encuentra igual.
- [ ] 4.5 📱 Cierra la app y abre la **cámara normal** del teléfono → apunta a la etiqueta. ✓ Ofrece abrir Landak Apiario en esa colmena.
- [ ] 4.6 📱 Colmena → **Etiqueta QR** → **Cambiar etiqueta** → escanea una etiqueta nueva → luego **Escanear** la etiqueta vieja. ✓ "no está asignado".
- [ ] 4.7 📱 **Escanear** el QR de cualquier página web. ✓ "no es de Landak Apiario".

### 5. Ficha e historial (M6) — 📱 como `owner@landak.test`
- [ ] 5.1 📱 Abre C-01. ✓ Banda oscura con el nombre y el apiario; si la colmena necesita algo, una tarjeta de atención; "Última revisión hace … · por …"; botón **Nueva revisión** abajo.
- [ ] 5.2 📱 Baja por el historial. ✓ Lo más nuevo primero; las notas van dentro de su revisión; al final **Cargar más**.
- [ ] 5.4 📱 Pestaña **Inicio**. ✓ Secciones "Para revisar", "Tareas" (ej. Alimentar) y "Última actividad".

### 6. Revisión en campo (M7) — 📱 como `owner@landak.test`, modo avión y Wi-Fi apagado, con guantes
- [ ] 6.1 📱 C-01 → **Nueva revisión** → llena cada sección solo con toques. Toca otra vez un chip ya elegido. ✓ Se desmarca.
- [ ] 6.2 📱 En Varroa: lavado con 300 abejas y 7 ácaros. ✓ "Carga: 2,3 %". Agrega una nota.
- [ ] 6.4 📱 **Terminar**. ✓ "Guardado…" con **Deshacer** → tócalo. ✓ Vuelves a la revisión con los datos → **Terminar** otra vez.
- [ ] 6.5 📱 **Prende el Wi-Fi y quita el modo avión**. 🗄️ Studio. ✓ Una fila nueva en `inspections` y una en `notes`.
- [ ] 6.6 📱 Cambia a `reviewer@landak.test` → abre una revisión del owner y una tuya. ✓ Solo puedes editar la tuya.

### 7. Voz (M8) — 📱 como `owner@landak.test`
- [ ] 7.0 📱 Ajustes del teléfono → Google → Voz → Reconocimiento sin conexión → descarga Español.
- [ ] 7.1 📱 **Modo avión y Wi-Fi apagado** → C-01 → **Nueva revisión** → **Dictar** → di: "La reina no se vio, hay buena postura, tres cuadros de cría, reservas bajas. Alimentar y revisar en ocho días." ✓ Aparecen unas 7 propuestas.
- [ ] 7.2 📱 Quita una, cambia otra → **Aceptar todo** → **Terminar** → **prende el Wi-Fi y quita el modo avión**. 🗄️ Studio → `inspections`. ✓ La revisión tiene `source = voice` y el texto dictado.
- [ ] 7.3 📱 En una revisión, abre una nota → **Dictar** dentro de la nota. ✓ El texto queda en la nota.
- [ ] 7.4 📱 Borra el paquete de voz (Ajustes → Google → Voz) → **modo avión y Wi-Fi apagado** → **Dictar**. ✓ Aviso antes de escuchar.
- [ ] 7.5 📱 Ajustes del teléfono → Apps → Landak Apiario → Permisos → niega el micrófono → **Dictar**. ✓ Mensaje claro; los toques siguen funcionando.
- [ ] 7.6 📱 En una revisión de C-01 di "Colmena 12…". ✓ Advierte que no es esta colmena.

### 8. Fotos (M9) — 📱 como `owner@landak.test`
- [ ] 8.1 📱 En una revisión → **Foto** → permite la cámara → toma 3 fotos con guantes → quita una de la tira → **Deshacer** → **Listo**. ✓ Quedan 3.
- [ ] 8.2 📱 **Modo avión y Wi-Fi apagado** → 2 fotos más. ✓ Se guardan.
- [ ] 8.4 📱 Mata la app mientras suben fotos. ✓ Al abrirla siguen subiendo. 🗄️ Studio → **Storage** (menú izquierdo). ✓ Cada foto tiene su `.jpg` y su `.thumb.jpg`.
- [ ] 8.5 💻 Admin → abre esa colmena. ✓ Muestra las fotos. 📱 Como `reviewer@landak.test`. ✓ Ves la miniatura y luego la foto completa.
- [ ] 8.6 📱 Abre una foto → **Eliminar** → **Deshacer**. ✓ Sigue. ➜ Elimínala otra vez. ✓ Desaparece del historial.

### 9. Actividades (M10) — 📱 como `owner@landak.test`, modo avión y Wi-Fi apagado
- [ ] 9.1 📱 C-01 → **Registrar actividad** → Alimentación, Jarabe, 2 l, 1:1 → **Guardar**. ✓ En el historial: "Alimentación · Jarabe de azúcar 1:1 · 2 l".
- [ ] 9.2 📱 **Registrar actividad** → Cambio de reina, año 2026. ✓ Sugiere "Blanco"; la colmena muestra la reina nueva.
- [ ] 9.3 📱 **Registrar actividad** → Traslado → La Loma. ✓ C-01 aparece en La Loma.
- [ ] 9.4 📱 **Registrar actividad** → División → **Crear la nueva colmena ahora**. ✓ Formulario prellenado; la actividad queda enlazada a la colmena nueva.
- [ ] 9.5 📱 **Prende el Wi-Fi y quita el modo avión**. 🗄️ Studio. ✓ Filas nuevas en `hive_events` y `hives` actualizadas.
- [ ] 9.6 📱 Cambia a `reviewer@landak.test` → C-02 → **Registrar actividad** → Pérdida. ✓ "Avisa al propietario…"; C-02 sigue Activa.
- [ ] 9.7 📱 En una revisión: **Actividad** → Tratamiento → **Terminar**. ✓ Queda dentro de la revisión. ➜ **Deshacer**. ✓ La colmena vuelve como estaba.
- [ ] 9.8 📱 En el historial toca una actividad → edítala → **Eliminar** → **Deshacer**. ✓ Vuelve.

### 10. Personas e invitaciones (M11) — 📱 como `owner@landak.test`, con conexión
- [ ] 10.1 📱 **Perfil** → **Personas de la finca** → **Invitar persona** → nombre "Ayudante", rol Revisor → **Crear código**. ✓ Muestra el código → **Compartir por WhatsApp**. ✓ Abre WhatsApp directo con el mensaje (sin WhatsApp: el menú de compartir). **Compartir de otra forma** abre siempre el menú. Mándatelo a ti mismo y anota el código.
- [ ] 10.2 📱 Cierra sesión → **Crear cuenta** con un correo nuevo → en **Empecemos**, **Tengo un código** → escribe el código. ✓ Entras a Finca Landak como Revisor, sin "Invitar persona". Esta cuenta es "el Ayudante" de aquí en adelante.
- [ ] 10.3 📱 Cierra sesión → otra cuenta nueva → **Tengo un código** con el mismo código. ✓ "El código no es válido…".
- [ ] 10.4 📱 Como owner: **Personas** → Ayudante → chip **Propietario** → **Cambiar rol**. ➜ Entra como el Ayudante → **Pendientes** → **Sincronizar ahora**. ✓ Tiene botones de propietario. ➜ Como owner, devuélvelo a Revisor.
- [ ] 10.5 📱 Entra con la cuenta de 1.4 (única propietaria de su finca) → **Perfil** → **Salir de esta finca**. ✓ "La finca debe tener al menos un propietario".
- [ ] 10.6 📱 Como owner: **modo avión y Wi-Fi apagado** → **Personas**. ✓ "Sin conexión". ➜ **Prende el Wi-Fi y quita el modo avión** → **Intentar de nuevo**. ✓ Carga.
- [ ] 10.7 📱 Como el Ayudante: **modo avión y Wi-Fi apagado** → haz una revisión → **Perfil** → **Salir de esta finca**. ✓ Avisa cuántos registros faltan por sincronizar → **prende el Wi-Fi y quita el modo avión** → **Sincronizar primero** → luego **Salir**. ✓ La finca y sus fotos desaparecen del teléfono.
- [ ] 10.8 📱 Como owner: **Invitar persona** → crea otro código → **Cancelar código** → úsalo en una cuenta nueva. ✓ No sirve.
- [ ] 10.9 💻 Admin → Usuarios → el Ayudante: cambia su rol, luego quítalo de la finca, luego desactívalo. 📱 Como owner, tras cada cambio: **Pendientes** → **Sincronizar ahora** → **Personas**. ✓ Se refleja cada cambio; al final dice "Desactivado".

### 11. Rediseño Panal (M13) — 📱
- [ ] 11.1 📱 **Perfil** → **Galería de componentes**. ✓ Botones píldora (verde, miel, tonal, rojo, "Cancelar" solo texto) que se hunden al tocarlos. Campos rellenos con la etiqueta adentro; el de error tiene borde rojo e ícono. Avisos rojo, miel y verde con ícono.
- [ ] 11.2 📱 Cierra sesión. ✓ Bienvenida oscura con el panal; **Iniciar sesión** es el botón; "¿No tienes cuenta? Crear cuenta" es un enlace.
- [ ] 11.3 📱 **Crear cuenta** → contraseña de 5 caracteres → toca el siguiente campo. ✓ "La contraseña debe tener al menos 8 caracteres." con ícono; al completar 8 se quita sola.
- [ ] 11.4 📱 Inicio, Apiarios, una colmena, Perfil, Pendientes. ✓ No quedan cajas con borde gris; la barra de abajo marca la pestaña con una pastilla verde.
- [ ] 11.5 📱 Al sol, a un brazo de distancia, con guantes: Inicio, una colmena y una revisión. ✓ Todo se lee y cada botón responde.
- [ ] 11.6 📱 **Nueva revisión**. ✓ Misma distribución y tamaños de antes; solo cambian las formas.
- [ ] 11.7 📱 Ajustes del teléfono → Pantalla → tamaño de letra al máximo → vuelve a la app. ✓ Nada se corta.

### 12. Rol Observador (M14) — 📱
Usa `reviewer@landak.test` como "el observador" (o el Ayudante de la sección 10 si aún existe).
- [ ] 12.1 📱 Como `owner@landak.test`: **Perfil** → **Personas de la finca** → toca a `reviewer@landak.test`. ✓ Chips Propietario / Revisor / Observador con Revisor marcado y **Cambiar rol** apagado. ➜ Toca **Observador**. ✓ La línea de ayuda cambia y **Cambiar rol** se enciende → tócalo. ✓ "… ahora es observador" y su insignia dice Observador.
- [ ] 12.2 📱 **Invitar persona**. ✓ Tres chips; cada uno cambia la línea de ayuda. ➜ Crea un código **Observador** → cierra sesión → **Crear cuenta** nueva → **Tengo un código** → escríbelo. ✓ En **Perfil** su insignia dice Observador.
- [ ] 12.3 📱 Cambia a `reviewer@landak.test` (ahora observador). ✓ **Inicio** muestra Para revisar, Tareas y Última actividad. ➜ Abre una colmena. ✓ No hay Nueva revisión, Registrar actividad ni Tomar foto; sí historial, fotos y datos.
- [ ] 12.4 📱 Abre una revisión, una actividad del historial y una foto. ✓ Sin Editar, sin Eliminar, sin "Agregar descripción" (la descripción, si hay, se lee).
- [ ] 12.5 📱 **Escanear** el QR de una colmena. ✓ Abre la colmena sin botones de escribir. ➜ **Pendientes**. ✓ Vacío.
- [ ] 12.6 📱 **Modo avión y Wi-Fi apagado**. ✓ Todo lo ya cargado se sigue leyendo. ➜ **Prende el Wi-Fi y quita el modo avión**.
- [ ] 12.7 📱 Cambia a `owner@landak.test` → **Personas** → `reviewer@landak.test` → **Revisor** → **Cambiar rol**. ➜ Cambia a `reviewer@landak.test` → **Pendientes** → desliza hacia abajo para sincronizar. ✓ Vuelven los botones sin cerrar sesión.

### 13. Panal en todas las pantallas (M15) — 📱
- [ ] 13.1 📱 Cierra sesión → Bienvenida → **Iniciar sesión**. ✓ Franja oscura con panal y el título en blanco; el formulario sube como hoja clara; "Volver" arriba de la hoja; "¿Olvidaste tu contraseña?" es un enlace y abre su hoja. ➜ Escribe correo y contraseña. ✓ **Ingresar** se enciende sin que la app se caiga.
- [ ] 13.2 📱 Mira **Crear cuenta**, **Tengo un código**, **Empecemos** y **Crea tu finca**. ✓ La misma franja.
- [ ] 13.3 📱 Pestañas **Apiarios**, **Pendientes** y **Perfil**. ✓ Franja arriba; en Apiarios y Pendientes sube con la lista; Buscar funciona; en Pendientes, deslizar hacia abajo sincroniza.
- [ ] 13.4 📱 **Perfil** → **Tus fincas**, **Personas** (la finca en la línea pequeña), **Invitar persona** y el código creado. ✓ Franja en todas.
- [ ] 13.5 📱 Un apiario (lista de colmenas), Nuevo / Editar apiario, Nueva / Editar colmena, Etiqueta QR, Fotos, Cambiar etiqueta (la colmena en la línea pequeña), una revisión ya hecha y Registrar actividad (tipo en grande, colmena en la línea pequeña). ✓ Franja y "Volver" en la hoja.
- [ ] 13.6 📱 **Nueva revisión**, **Escanear** y la cámara. ✓ Igual que antes: sin franja.

### Con el APK (no se prueban en la app de desarrollo)
La app de desarrollo baja su código desde Metro al abrir: si la matas sin Wi-Fi no arranca, y con datos móviles no llega al Supabase de tu Mac. Estos pasos van con el APK instalado (contra D1).
- [ ] 2.3 📱 Modo avión y Wi-Fi apagado: mata la app y ábrela. ✓ El apiario y la colmena siguen en **Apiarios**.
- [ ] 5.3 📱 Modo avión y Wi-Fi apagado → mata la app → ábrela. ✓ La ficha se ve igual.
- [ ] 6.3 📱 Bloquea el teléfono 30 s → mata la app → ábrela. ✓ "Continuando la revisión…" con todo lo que llenaste.
- [ ] 8.3 📱 **Perfil** → "Subir fotos con datos móviles" en **Solo con Wi-Fi** → apaga el Wi-Fi. ✓ La revisión se sincroniza y **Pendientes** dice "N fotos esperando Wi-Fi" → **Subir ahora con datos**. ✓ Suben.
- [ ] 13.7 📱 ✓ En el cajón de apps el ícono es el panal ámbar sobre azul oscuro, también con forma de círculo o de gota; con íconos temáticos (Android 13+) se ve el panal en monocromo. ✓ Al abrir, la pantalla de carga es azul oscura con el panal.

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
