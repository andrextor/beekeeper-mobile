import { CloudOff, Hourglass, Link2, ScanQrCode, ShieldQuestion } from 'lucide-react-native'
import { ActivityIndicator, Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { groupedQrCode } from '@/lib/qr-code'
import { color } from '@/lib/theme'
import type { LookupState } from './useCodeLookup'

type Props = {
  state: Exclude<LookupState, { kind: 'idle' }>
  onRescan: () => void
  onAssign: (code: string) => void
}

/** Full-screen answers with two big buttons, never a dialog (spec M5 → Field use). */
export function ScanOutcome({ state, onRescan, onAssign }: Props) {
  if (state.kind === 'looking') {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-bg-soft p-6">
        <ActivityIndicator size="large" color={color.primary} />
        <Text className="font-display text-section text-text">Buscando la colmena…</Text>
      </View>
    )
  }
  const rescan = { label: 'Volver a escanear', onPress: onRescan }
  const content = {
    unassigned: {
      icon: Link2,
      title: 'Este código no está asignado',
      body: 'Puedes ponerlo a una colmena de tu finca, por ejemplo si su etiqueta se dañó.',
    },
    not_ours: {
      icon: ShieldQuestion,
      title: 'Esta colmena no pertenece a tus apiarios',
      body: 'El código existe, pero no es de una finca tuya, o nadie lo usa.',
    },
    offline_unknown: {
      icon: CloudOff,
      title: 'No encontramos esta colmena en el teléfono',
      body: 'Cuando tengas señal la buscaremos de nuevo.',
    },
    not_synced: {
      icon: Hourglass,
      title: 'La colmena aún no llega a este teléfono',
      body: 'Es de una de tus fincas. Espera un momento y vuelve a escanear.',
    },
  }[state.kind]

  return (
    <View className="flex-1 bg-bg-soft p-4">
      <EmptyState
        icon={content.icon}
        title={content.title}
        body={`${content.body}\n\nCódigo ${groupedQrCode(state.code)}`}
        action={
          state.kind === 'unassigned'
            ? { label: 'Asignar a una colmena', onPress: () => onAssign(state.code) }
            : rescan
        }
      />
      {state.kind === 'unassigned' ? (
        <Button variant="secondary" icon={ScanQrCode} {...rescan} />
      ) : null}
    </View>
  )
}
