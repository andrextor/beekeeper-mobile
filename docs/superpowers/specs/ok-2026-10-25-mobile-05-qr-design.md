# M5 · QR: generate, print/share labels, scan → hive, re-label — spec

Date: 2026-10-25 · Branch: `feat/m5-qr` · Status: **approved** (Iván, 2026-10-26) · Version: 0.5.0

## Problem

In the apiary the beekeeper must reach the right hive in one gesture: point the phone at the box. Every hive needs a printed label whose code is unique worldwide, carries nothing private, survives re-labelling, and can be read with no signal.

## Decisions

### Code

| Item | Decision |
|------|----------|
| Alphabet | Crockford base32 `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (no I, L, O, U) |
| Length | 10 characters (32^10 ≈ 1.1 × 10^15) |
| Generation | `expo-crypto` `getRandomValues` (10 bytes), each byte `% 32` → alphabet index (32 divides 256: no modulo bias); shipped in M4 |
| When | When a hive is created. `qr_code` is required by B3, so M4 already ships `newQrCode()` in `src/lib/qr-code.ts`; this module adds the reading helpers to the same file |
| Collision | `23505` on `hives_qr_code_key` → `qr_taken`. On a new hive the pusher regenerates silently (M4). On a **re-label** it is a permanent failure with "Ese código QR ya está en uso en otra colmena." and the Pendientes fix action "Generar otro código" (the scanned label belongs to another hive, possibly of another organization) |
| Normalization on read | Uppercase; `O→0`, `I→1`, `L→1` (Crockford decoding rules); strip spaces and dashes |

`src/lib/qr-code.ts`: `newQrCode()`, `isQrCode(s)` (M4; regex `^[0-9A-HJKMNP-TV-Z]{10}$`, same as B3), plus `normalizeQrCode(input)` and `parseQrPayload(text)` (this module).

### Payload

The QR encodes `landak://h/<qr_code>`. The scanner also accepts a bare 10-char code (manual typing, labels printed by hand). Any other content → "Este código no es de Landak Apiario".

### Label generation

- **`qrcode-generator`** (pure JS, already used by Iván in `neoteam-social-run`) produces one SVG string per code. The same string renders on screen (`SvgXml` from `react-native-svg`, already installed with Lucide) and goes into print HTML.
- Label content: hive name (the print WebView's bold sans, large; embedding Plus Jakarta Sans would need `expo-asset` + `expo-file-system` to read the font file, not worth it for a label), QR (error correction `M`, quiet zone 4 modules), the code as text in groups `ABCDE-FGHIJ` (for manual entry if the QR is damaged), "Landak Apiario". **No apiary name, location or organization.**
- **`expo-print`** `printToFileAsync({ html })` → PDF, then **`expo-sharing`** `shareAsync` (WhatsApp, Drive, a print shop). Also `Print.printAsync` for a printer on the phone. Works offline.
- Two layouts in `src/features/qr/label-html.ts`:
  - Single label 6 × 8 cm (hive screen → "Etiqueta QR").
  - A4 sheet, 3 × 4 labels per page, every non-deleted hive of an apiary sorted by name, paged (apiary screen → "Imprimir etiquetas").
- Owner and reviewer can print (reading is allowed to both).

### Scanning

| Item | Decision |
|------|----------|
| Camera | `expo-camera` `CameraView`, `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`, `onBarcodeScanned` |
| Route | `src/app/(tabs)/scan.tsx` (the center tab) |
| Overlay | Square viewfinder 70 % of width, `honey` corners; hint "Apunta al código de la colmena" |
| Torch | 72-dp toggle bottom-left (`flashlight` / `flashlight-off`), "Linterna" label |
| Manual entry | 72-dp "Escribir código" bottom-right → sheet with one big text field (autoCapitalize characters) |
| Feedback | On a valid read: success haptic, scanner pauses (ignore further reads 1.5 s), navigate |
| Permission | Denied → `ErrorState` "Necesitamos la cámara para leer el código" + "Abrir ajustes" (`Linking.openSettings`) |

### Lookup sequence (`src/features/qr/lookup.ts`)

1. Local SQLite: `select id, organization_id from hives where qr_code = ? and deleted_at is null` across every organization on the phone → found: open `/hive/<id>` (the route switches the active organization if it belongs to another one, with a toast "Cambiaste a <finca>"; `features/qr` never reads the session).
2. Not found, online: `supabase.from('hives').select('id, organization_id').eq('qr_code', code).is('deleted_at', null).maybeSingle()` under RLS (15 s timeout) → found: the hive is ours but not on the phone yet; run a full sync ("Buscando la colmena…"), then open it once the row is local.
3. Not found anywhere:
   - User is owner of the active organization → "Este código no está asignado" with **"Asignar a una colmena"** (pick a hive of the active organization → re-label flow below) and "Volver a escanear".
   - Otherwise → "Esta colmena no pertenece a tus apiarios".
4. Offline and not found locally → "No encontramos esta colmena en el teléfono. Cuando tengas señal la buscaremos de nuevo." (no false "does not belong").

RLS cannot distinguish "exists in another organization" from "does not exist" (by design, no existence leak), so step 3 shows the same text for both to non-owners.

### Re-label (owner only)

Hive screen → "Cambiar etiqueta" (damaged label) or the "Asignar a una colmena" path:

1. New code: scan a new label (pre-printed sheets) or "Generar código nuevo".
2. One local transaction (M4's `saveRows`): update `hives.qr_code`, insert a `hive_events` row `type = 'qr_relabel'`, `details = { old_qr_code, new_qr_code }`, `occurred_at = now`; both into the outbox. The relabel helper moves from M4's `src/features/sync/qr-taken.ts` to `src/features/sync/relabel.ts` and serves both the pusher's automatic fix and this flow (`features/qr` may import `sync`, not the reverse).
   - If a `qr_relabel` event of this hive is still in the outbox, it is updated instead of adding another one (`old_qr_code` stays the code the server knows), so the timeline never shows a code that failed.
   - A `qr_relabel` event waits in the outbox while its hive has an entry there (pusher rule, like M3's "child waits for its parent"), so it never reaches the server before the code it announces.
   - The pusher's automatic fix for a new hive stays capped at 3 per hive, now counted in memory for the app session (updating the event no longer adds events to count; a real repeat is impossible at these odds, the cap only stops a loop).
3. Offer to print the new label.

Reviewer does not see the action (B3: only owners update hives).

### Deep link

`app.json` `scheme: "landak"` (set in M1). Expo Router route `src/app/h/[code].tsx` receives `landak://h/<code>` (e.g. a QR scanned with the system camera), runs the same lookup and replaces itself with the hive screen. Not signed in → the code is kept in memory, sign-in first, then the tabs layout opens it (lost if the app is killed meanwhile: the person scans again).

## Rejected alternatives

- `react-native-qrcode-svg`: renders on screen but needs a ref + `toDataURL` per code for printing; `qrcode-generator` gives SVG strings for both uses with one dependency and no native code.
- `expo-barcode-scanner`: deprecated in favor of `CameraView`.
- Encoding an https URL: there is no website to land on and it would reveal a domain owner; `landak://` opens the app or nothing.
- Short sequential codes ("C-12") in the QR: not globally unique, guessable, and break on re-labelling.

## Security constraints

- The code is opaque; reading it gives no data without a session and a membership (RLS).
- The scanner only accepts our payload format; arbitrary URLs from a QR are never opened.
- Labels never print location or owner.

## Field use

- Torch and manual entry are 72 dp in the thumb zone; the viewfinder works at 15–40 cm, through a veil.
- Scan works in airplane mode for hives already on the phone.
- A dirty or wet label: manual entry of the 10 characters, tolerant of O/0 and I/1/L.
- No dialogs: an unknown code shows a full-screen state with two big buttons.

## Backend contract used

- `hives.qr_code` (B3): globally unique, `^[0-9A-HJKMNP-TV-Z]{10}$`, error `qr_taken`.
- `hives` update by owner only (B3 RLS).
- `hive_events` `type = 'qr_relabel'`, `details = { old_qr_code: string, new_qr_code: string }` (B4).
- `hives` select under RLS for the online fallback.

## Out of scope

NFC tags, Bluetooth label printers, batch pre-printed unassigned label sheets with codes reserved server-side, scanning several hives in a row (M7 jornada later).
