// Copied verbatim from beekeeper admin/src/lib/labels.ts (every enum in docs/api.md); api.md wins.

export const hiveTypeLabels = {
  langstroth: 'Langstroth',
  dadant: 'Dadant',
  top_bar: 'Kenyana (barras)',
  warre: 'Warré',
  nucleus: 'Núcleo',
  rustic: 'Rústica',
  other: 'Otra',
} as const

export const colonyOriginLabels = {
  swarm_capture: 'Captura de enjambre',
  split: 'División',
  package: 'Paquete de abejas',
  nucleus_purchase: 'Núcleo comprado',
  colony_purchase: 'Colmena comprada',
  unknown: 'Desconocido',
} as const

export const queenColorLabels = {
  white: 'Blanco',
  yellow: 'Amarillo',
  red: 'Rojo',
  green: 'Verde',
  blue: 'Azul',
} as const

export const queenOriginLabels = {
  own_rearing: 'Cría propia',
  purchased: 'Comprada',
  natural: 'Natural (reemplazo)',
  unknown: 'Desconocido',
} as const

export const hiveStatusLabels = {
  active: 'Activa',
  inactive: 'Inactiva',
  dead: 'Muerta',
  absconded: 'Fugada',
  merged: 'Unida',
  sold: 'Vendida',
} as const

export const roleLabels = {
  owner: 'Propietario',
  reviewer: 'Revisor',
} as const

export const inspectionSourceLabels = { manual: 'Manual', voice: 'Por voz' } as const

export const observedLabels = { yes: 'Sí', no: 'No', not_checked: 'No revisado' } as const

export const queenCellsLabels = {
  none: 'Ninguna',
  swarm: 'De enjambrazón',
  supersedure: 'De reemplazo',
  not_checked: 'No revisado',
} as const

export const broodPatternLabels = {
  compact: 'Compacta',
  spotty: 'Salteada',
  not_checked: 'No revisado',
} as const

export const storesLabels = {
  low: 'Pocas',
  ok: 'Suficientes',
  high: 'Abundantes',
  not_checked: 'No revisado',
} as const

export const varroaMethodLabels = {
  alcohol_wash: 'Lavado con alcohol',
  sugar_roll: 'Azúcar glas',
  sticky_board: 'Bandeja adhesiva',
  visual: 'Visual',
} as const

export const pestLabels = {
  wax_moth: 'Polilla de la cera',
  small_hive_beetle: 'Escarabajo de la colmena',
  ants: 'Hormigas',
  wasps: 'Avispas',
  mice: 'Ratones',
  other: 'Otra',
} as const

export const diseaseSignLabels = {
  chalkbrood: 'Cría yesificada',
  sacbrood: 'Cría ensacada',
  foulbrood_signs: 'Signos de loque',
  deformed_wings: 'Alas deformes',
  dysentery: 'Diarrea',
  dead_bees: 'Abejas muertas',
  other: 'Otro',
} as const

export const weatherLabels = {
  sunny: 'Soleado',
  cloudy: 'Nublado',
  rain: 'Lluvia',
  windy: 'Viento',
} as const

export const attentionLevelLabels = {
  none: 'Sin novedad',
  soon: 'Pronto',
  urgent: 'Urgente',
} as const

export const plannedActionLabels = {
  feed: 'Alimentar',
  treat: 'Tratar',
  change_queen: 'Cambiar reina',
  add_super: 'Poner alza',
  remove_super: 'Quitar alza',
  harvest: 'Cosechar',
  split: 'Dividir',
  merge: 'Unir',
  move: 'Trasladar',
  check_queen: 'Revisar reina',
  other: 'Otra',
} as const

export const eventTypeLabels = {
  note: 'Nota',
  feeding: 'Alimentación',
  treatment: 'Tratamiento',
  queen_change: 'Cambio de reina',
  harvest: 'Cosecha',
  split: 'División',
  merge: 'Unión',
  transfer: 'Traslado',
  swarm: 'Enjambre',
  loss: 'Pérdida',
  qr_relabel: 'Cambio de etiqueta QR',
} as const

export const feedLabels = {
  sugar_syrup: 'Jarabe de azúcar',
  fondant: 'Fondant',
  pollen_patty: 'Torta proteica',
  honey: 'Miel',
  other: 'Otro alimento',
} as const

export const treatmentMethodLabels = {
  strip: 'Tiras',
  drip: 'Goteo',
  vapor: 'Vapor',
  dust: 'Espolvoreo',
  other: 'Otro método',
} as const

export const harvestProductLabels = {
  honey: 'Miel',
  pollen: 'Polen',
  propolis: 'Propóleo',
  wax: 'Cera',
} as const

export const lossCauseLabels = {
  starvation: 'Hambre',
  pests: 'Plagas',
  disease: 'Enfermedad',
  absconding: 'Fuga',
  pesticide: 'Pesticida',
  unknown: 'Causa desconocida',
} as const

export const queenChangeReasonLabels = {
  failing: 'Reina fallando',
  aggressive: 'Colmena agresiva',
  lost: 'Reina perdida',
  planned: 'Planificado',
} as const

/** The database stores these as text; an unknown value (a newer server) shows as is instead of breaking. */
export function label(
  labels: Readonly<Record<string, string>>,
  value: string | null | undefined,
): string {
  if (value == null) return '—'
  return Object.hasOwn(labels, value) ? (labels[value] ?? value) : value
}

// App-only words for the 1–5 scales; api.md names only their ends.
export const populationStrengthLabels = {
  1: 'Muy débil',
  2: 'Débil',
  3: 'Normal',
  4: 'Fuerte',
  5: 'Muy fuerte',
} as const

export const temperamentLabels = {
  1: 'Mansa',
  2: 'Tranquila',
  3: 'Normal',
  4: 'Defensiva',
  5: 'Muy defensiva',
} as const
