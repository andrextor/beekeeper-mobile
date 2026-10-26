import { CameraView, useCameraPermissions } from 'expo-camera'
import { Camera, Flashlight, FlashlightOff, Keyboard, type LucideIcon } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Linking, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cx } from '@/lib/cx'
import { withTap } from '@/lib/haptics'
import { parseQrPayload } from '@/lib/qr-code'
import { color, iconSize, iconStroke } from '@/lib/theme'
import { ManualCodeSheet } from './ManualCodeSheet'

const pauseMs = 1500

function Corner({ position }: { position: string }) {
  return <View className={cx('absolute size-10 border-accent', position)} />
}

function BigToggle({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={withTap(onPress)}
      className="min-h-field min-w-field items-center justify-center gap-1 rounded-card bg-deep/80 px-4 py-2 active:opacity-80"
    >
      <Icon color={color.bg} size={iconSize.field} strokeWidth={iconStroke.field} />
      <Text className="font-sans-semibold text-caption text-white">{label}</Text>
    </Pressable>
  )
}

/** The center tab's camera: QR only, torch and manual entry in the thumb zone, 1.5 s between reads. */
export function ScannerView({ onCode }: { onCode: (code: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [torch, setTorch] = useState(false)
  const [typing, setTyping] = useState(false)
  const [foreign, setForeign] = useState(false)
  const pausedUntil = useRef(0)
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const frame = Math.round(width * 0.7)

  const manual = (
    <ManualCodeSheet
      visible={typing}
      onClose={() => setTyping(false)}
      onCode={(code) => {
        setTyping(false)
        onCode(code)
      }}
    />
  )

  if (!permission) return null
  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center gap-3 bg-bg-soft p-4">
        <EmptyState
          icon={Camera}
          title="Necesitamos la cámara para leer el código"
          body="Solo se usa mientras esta pantalla está abierta."
          action={
            permission.canAskAgain
              ? { label: 'Permitir cámara', onPress: () => void requestPermission() }
              : { label: 'Abrir ajustes', onPress: () => void Linking.openSettings() }
          }
        />
        {permission.canAskAgain ? null : (
          <Text className="text-center font-sans text-caption text-muted">
            Ajustes → Permisos → Cámara → Permitir
          </Text>
        )}
        <Button
          variant="secondary"
          icon={Keyboard}
          label="Escribir código"
          onPress={() => setTyping(true)}
        />
        {manual}
      </View>
    )
  }

  const scanned = ({ data }: { data: string }) => {
    const now = Date.now()
    if (now < pausedUntil.current) return
    pausedUntil.current = now + pauseMs
    const code = parseQrPayload(data)
    if (code) return onCode(code)
    // Any other QR (a website, a payment) is never opened.
    setForeign(true)
    setTimeout(() => setForeign(false), pauseMs * 2)
  }

  return (
    <View className="flex-1 bg-deep">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned}
      />
      <View
        pointerEvents="box-none"
        className="absolute inset-0 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <View style={{ width: frame, height: frame }}>
          <Corner position="top-0 left-0 border-t-4 border-l-4 rounded-tl-card" />
          <Corner position="top-0 right-0 border-t-4 border-r-4 rounded-tr-card" />
          <Corner position="bottom-0 left-0 border-b-4 border-l-4 rounded-bl-card" />
          <Corner position="bottom-0 right-0 border-b-4 border-r-4 rounded-br-card" />
        </View>
        <Text className="mt-6 rounded-full bg-deep/80 px-4 py-2 font-sans-semibold text-body text-white">
          {foreign ? 'Este código no es de Landak Apiario' : 'Apunta al código de la colmena'}
        </Text>
      </View>
      <View className="absolute right-4 bottom-6 left-4 flex-row justify-between">
        <BigToggle
          icon={torch ? FlashlightOff : Flashlight}
          label="Linterna"
          onPress={() => setTorch((on) => !on)}
        />
        <BigToggle icon={Keyboard} label="Escribir código" onPress={() => setTyping(true)} />
      </View>
      {manual}
    </View>
  )
}
