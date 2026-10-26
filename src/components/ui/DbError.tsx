import { DatabaseBackup, Send } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { color, iconSize } from '@/lib/theme'
import { Button } from './Button'

type Props = { onShare: () => void; onRetry: () => void }

/** Shown instead of the app when the local database cannot open; the data stays untouched. */
export function DbError({ onShare, onRetry }: Props) {
  return (
    <View accessibilityRole="alert" className="flex-1 justify-center gap-4 bg-bg-soft px-6">
      <DatabaseBackup color={color.danger} size={iconSize.state} strokeWidth={1.75} />
      <Text className="font-display text-title text-text">No pudimos actualizar los datos</Text>
      <Text className="font-sans text-body text-text">
        Tus registros siguen guardados en este teléfono. No desinstales la app: envía el respaldo a
        Iván por WhatsApp y él te dice qué hacer.
      </Text>
      <Button icon={Send} label="Enviar respaldo" className="min-h-field" onPress={onShare} />
      <Button variant="secondary" label="Intentar de nuevo" onPress={onRetry} />
    </View>
  )
}
