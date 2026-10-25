# M8 · Voice dictation, Spanish field parser and confirmation — spec

Date: 2026-10-25 · Branch: `feat/m8-voice` · Status: **awaiting OK** · Version: 0.8.0

## Problem

Tapping with gloves is slow; talking is not. The beekeeper says "La reina no se vio, buena postura, tres cuadros de cría, reservas bajas, revisar en ocho días" and the app should propose those fields. Recognition must be free, should work without signal, and an inference must never become a saved fact without the user confirming it (overview §3).

## Decisions

### Three separate capabilities

| Capability | Decision |
|------------|----------|
| 1. Speech → text | `expo-speech-recognition` (Android `SpeechRecognizer`), on-device when the Spanish offline model is installed, free |
| 2. Text kept as is | `inspections.transcript` stores the raw recognized text (≤ 10000), never rewritten; notes keep their own text |
| 3. Text → fields | Rule-based Spanish parser `src/features/voice/parser.ts`, pure, offline, deterministic, tested |

No LLM in V1 (costs per call, needs network, harder to test). Later option, separate spec: an online "mejorar interpretación" that sends the transcript to a model and shows its proposals in the same confirmation screen.

### Recognition setup (`src/features/voice/recognition.ts`)

Verified against the installed `expo-speech-recognition` version at implementation time; intended calls:

1. `isRecognitionAvailable()` false → the Dictar tile shows "Dictado no disponible en este teléfono" and opens the text sheet instead.
2. Permissions: `requestPermissionsAsync()` (microphone + speech). Denied → `ErrorState` "Necesitamos el micrófono para dictar" + "Abrir ajustes"; the inspection continues by taps.
3. Locale: `getSupportedLocales()` → pick the first of `es-CO`, `es-419`, `es-US`, `es-ES`, `es-MX` present in `installedLocales` (offline) — otherwise the first present in `locales` (online only).
4. `supportsOnDeviceRecognition()` and an installed Spanish locale → start with `requiresOnDeviceRecognition: true`. Otherwise online recognition when connected.
5. Offline and no Spanish offline model → banner "Para dictar sin señal, descarga el paquete de voz en español" with **Descargar** (`androidTriggerOfflineModelDownload({ locale })` on Android 13+) or a short guide (Ajustes › Google › Voz › Reconocimiento de voz sin conexión › Español). Meanwhile the user types or taps.
6. Start options: `lang`, `interimResults: true`, `continuous: true`, `addsPunctuation: true` where supported, `androidIntentOptions.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS` ~ 4000.
7. Android < 13 ignores `continuous`: on `end` while the user has not tapped Detener, restart — **capped at 20 restarts per session** and stopped after 3 consecutive `no-speech` errors (no loop without an end).

Audio is not recorded or stored in V1 (privacy, storage). Recording audio offline for later transcription is out of scope.

### Dictation sheet (`src/components/field/DictationSheet.tsx`)

- Full-height sheet: live transcript (20 sp, interim text in `stone-700`, final in `deep`), a pulsing `mic` while listening, one 96-dp **Detener** button, "Listo" when stopped.
- Text can be edited by hand after stopping ("Corregir texto" opens the keyboard).
- Used from: the Dictar tile (inspection fields) and inside the Note sheet (M7) for notes (no parsing, `source: 'voice'`).
- `expo-keep-awake` already active in field mode.

### Parser (`src/features/voice/parser.ts`)

`parseInspection(text, { today, hiveName })` → `Proposal[]`:

```ts
type Proposal = {
  field: InspectionField | 'feeding_event' | 'hive_mismatch'
  value: unknown          // typed per field by a discriminated union in code
  confidence: 'high' | 'medium'
  span: [start: number, end: number]   // in the original text, for highlighting
  phrase: string          // the matched words
}
```

Pipeline: normalize (lowercase, strip accents, collapse spaces; keep a char map back to the original for spans) → split into clauses (`.`, `,`, `;`, ` y luego `, ` tambien `) → per clause run every rule → resolve conflicts (same field twice: the last mention wins, confidence drops to `medium`).

Numbers: `numbers.ts` turns Spanish words into integers 0–99 ("un/uno/una", "dos" … "quince", "dieciséis" … "veintinueve", "treinta y dos", "cuarenta"…) and accepts digits. "medio/media" → ignored (no half frames).

Negation: a clause containing `no`, `sin`, `ningun(a)`, `nada de`, `falta(n)` before the keyword negates it.

| Field | Phrases (normalized) → value | Confidence |
|-------|------------------------------|------------|
| `queen_seen` | "reina vista", "vi la reina", "esta la reina", "hay reina" → `yes`; "no se vio la reina", "no vi la reina", "sin reina", "no encontre la reina" → `no`; "no revise la reina" → `not_checked` | high |
| `eggs_seen` | "huevos", "postura", "buena postura", "hay postura" → `yes`; negated → `no` | high (postura → medium) |
| `larvae_seen` | "larvas", "cria abierta" → `yes`; negated → `no` | high |
| `queen_cells` | "celdas reales", "realeras", "celdas de enjambrazon" → `swarm`; "celdas de reemplazo", "supersedura" → `supersedure`; "sin celdas reales", "no hay realeras" → `none` | high |
| `brood_frames` | "<n> cuadros/marcos/panales de cria" | high |
| `honey_frames` | "<n> cuadros/marcos de miel" | high |
| `pollen_frames` | "<n> cuadros/marcos de polen" | high |
| `brood_pattern` | "cria compacta", "postura compacta" → `compact`; "cria salteada", "cria saltada", "postura salteada" → `spotty` | high |
| `stores` | "reservas bajas", "pocas reservas", "sin reservas", "poca miel" → `low`; "reservas buenas/normales/bien" → `ok`; "muchas reservas", "reservas altas", "llena de miel" → `high` | high |
| `population_strength` | "fuerza <1-5>" → n (high); "muy fuerte" → 5, "fuerte" → 4, "normal" (with colonia/colmena) → 3, "debil" → 2, "muy debil" → 1 (medium) | as noted |
| `temperament` | "muy mansa" → 1, "mansa/tranquila/calmada" → 2, "defensiva/brava/agresiva/picona" → 4, "muy brava/muy agresiva/muy defensiva" → 5 | medium |
| `pests` (adds) | "polilla" → `wax_moth`; "escarabajo" → `small_hive_beetle`; "hormigas" → `ants`; "avispas" → `wasps`; "raton(es)" → `mice`; negated → not added | high |
| `disease_signs` (adds) | "cria yesada/momificada" → `chalkbrood`; "cria ensacada" → `sacbrood`; "loque", "olor a podrido", "cria hundida" → `foulbrood_signs`; "alas deformes/deformadas" → `deformed_wings`; "diarrea", "disenteria", "manchas de excremento" → `dysentery`; "abejas muertas" → `dead_bees` | medium (signs, never a diagnosis) |
| `varroa_count` + `varroa_method` | "<n> varroas en (el) lavado/alcohol" → count + `alcohol_wash`; "... azucar" → `sugar_roll`; "... lamina/carton/bandeja" → `sticky_board` | high; sample size is never guessed |
| `weather` | "sol/soleado" → `sunny`; "nublado" → `cloudy`; "lluvia/lloviendo/llovizna" → `rain`; "viento/ventoso" → `windy` | high |
| `temperature_c` | "<n> grados" | high |
| `next_inspection_on` | "revisar/volver en <n> dias" → today+n; "en <n> semanas" → +7n; "la proxima semana" → +7; "en quince dias" → +15; "en un mes" → +30 | high |
| `attention_level` | "urgente", "grave", "emergencia", "ya mismo", "de inmediato" → `urgent`; "pronto", "pendiente", "hay que" → `soon` (urgent wins) | medium |
| `feeding_event` | past tense "alimente", "le di jarabe/azucar/fondant", "se alimento" → proposes a `feeding` event (`feed` from the word, `amount`/`unit` if "<n> litros/kilos") | medium |
| `planned_actions` | future/imperative "alimentar", "hay que alimentar", "poner alza", "quitar alza", "cambiar reina", "tratar", "cosechar", "dividir" → `feed`, `add_super`, `remove_super`, `change_queen`, `treat`, `harvest`, `split` (B4 `planned_actions`) + `attention_level = soon` if not set; unmatched imperative → `other` and the phrase appended to `notes` | medium |
| `hive_mismatch` | "colmena <name/number>" not matching the open hive → warning "Mencionaste la colmena 12 pero estás en C-01" (never switches hive) | — |

Anything not matched stays only in the transcript.

### Confirmation (`src/features/voice/ConfirmProposals.tsx`)

- Top: the transcript with each matched span highlighted (`honey` background, `deep` text).
- List: one 72-dp row per proposal: label + proposed value ("Cuadros de cría: 3"), confidence shown as a word for `medium` ("revisar"), and three big actions **Aceptar** (`check`) · **Cambiar** (opens that field's field-mode control in a sheet) · **Quitar** (`x`).
- "Aceptar todo" (96 dp) at the bottom; "Volver a dictar".
- A proposal that conflicts with a value already set in the draft shows both ("Antes: Normales → Ahora: Bajas").
- Accepted proposals are merged **into the draft only** (M7), `source` becomes `voice`, `transcript` is appended (several dictations in one inspection are joined with a newline). The inspection is saved only by Terminar (M7). Nothing is auto-saved from an inference.
- A `feeding_event` accepted here is stored in the draft and written at Terminar as a `hive_events` `feeding` row in the same transaction (M7 finish extended).

## Rejected alternatives

- Cloud speech APIs (Google Cloud, Whisper API): cost per minute, need signal.
- On-device Whisper (whisper.rn): free and offline but a 75–150 MB model download and heavy CPU on mid-range phones; revisit if Android's recognizer proves poor with apiary vocabulary.
- An LLM to extract fields: cost, network, non-deterministic; optional later.
- Auto-applying high-confidence proposals: violates "confirm before saving" (overview §3).

## Security constraints

- Microphone only while the dictation sheet is open; no audio stored or sent by the app. Online recognition sends audio to the phone's recognition service (Google) — stated once in the permission explainer: "Si no tienes el paquete sin conexión, el teléfono usa el servicio de voz de Google."
- The transcript is inspection data and follows the same RLS as the inspection.

## Field use

- Detener and Aceptar todo are 96 dp; every row action 72 dp.
- Works in airplane mode with the offline pack; without it, the app says so before the user starts talking.
- Wind and bees: the user can correct the text by hand and re-run the parser ("Interpretar de nuevo").
- If dictation fails at any point, the taps of M7 are always there; nothing blocks the inspection.

## Backend contract used

- `inspections.source = 'voice'`, `inspections.transcript` (B4).
- Every inspection column the parser fills, with B4 value sets.
- `hive_events` `note` with `details.source = 'voice'`; `feeding` with `details = { feed, amount?, unit? }` (B4).

## Out of scope

Audio recording and deferred transcription, LLM interpretation, other languages, voice commands for navigation ("siguiente colmena").
