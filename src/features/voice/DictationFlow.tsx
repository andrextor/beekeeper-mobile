import { CloudDownload, Settings } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Text, View } from 'react-native'

import { DictationSheet } from '@/components/field/DictationSheet'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { useDictation } from './useDictation'

type Props = {
  visible: boolean
  /** Characters still free in the inspection's transcript (10000 in all, B4). */
  room: number
  onDone: (text: string) => void
  onClose: () => void
}

function Notice({ children }: { children: string }) {
  return (
    <View className="rounded-card border-2 border-accent p-3">
      <Text className="font-sans text-body text-text">{children}</Text>
    </View>
  )
}

/** The Dictar flow used by field mode and the note sheet; if it fails, taps are still there. */
export function DictationFlow({ visible, room, onDone, onClose }: Props) {
  const dictation = useDictation(room)
  const [editing, setEditing] = useState<string | null>(null)
  const { plan } = dictation

  const close = () => {
    dictation.reset()
    setEditing(null)
    onClose()
  }

  return (
    <DictationSheet
      visible={visible}
      listening={dictation.listening}
      finalText={dictation.finalText}
      interim={dictation.interim}
      editing={editing}
      onEdit={setEditing}
      onToggleListening={() =>
        dictation.listening
          ? dictation.stop()
          : dictation.preparing
            ? undefined
            : void dictation.start()
      }
      onUse={() => {
        const text = (editing ?? dictation.finalText).trim()
        dictation.reset()
        setEditing(null)
        onDone(text)
      }}
      onClose={close}
    >
      {plan?.kind === 'needs_offline_pack' ? (
        <View className="gap-2">
          <Notice>Para dictar sin señal, descarga el paquete de voz en español.</Notice>
          <Button
            variant="secondary"
            icon={CloudDownload}
            label="Descargar"
            onPress={() => void dictation.downloadPack()}
          />
          <Button variant="secondary" label="Intentar igual" onPress={dictation.tryOnDevice} />
        </View>
      ) : null}
      {plan?.kind === 'denied' ? (
        <View className="gap-2">
          <Notice>
            Necesitamos el micrófono para dictar. Mientras tanto, sigue con los toques.
          </Notice>
          {plan.canAskAgain ? null : (
            <Button
              variant="secondary"
              icon={Settings}
              label="Abrir ajustes"
              onPress={() => void Linking.openSettings()}
            />
          )}
        </View>
      ) : null}
      {plan?.kind === 'unavailable' ? (
        <View className="gap-2">
          <Notice>Dictado no disponible en este teléfono. Puedes escribir el texto.</Notice>
          <Button
            variant="secondary"
            label="Escribir"
            onPress={() => setEditing(dictation.finalText)}
          />
        </View>
      ) : null}
      {plan?.kind === 'ready' && !plan.onDevice ? (
        <Text className="font-sans text-caption text-muted">
          Sin el paquete sin conexión, el teléfono usa el servicio de voz de Google.
        </Text>
      ) : null}
      {dictation.nearlyFull ? (
        <Notice>Queda poco espacio para dictar en esta revisión.</Notice>
      ) : null}
      <FormError message={dictation.error} />
    </DictationSheet>
  )
}
