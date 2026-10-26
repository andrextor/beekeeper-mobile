import { Redirect, router } from 'expo-router'
import {
  Camera,
  CircleCheck,
  Hexagon,
  Inbox,
  Mic,
  Plus,
  Save,
  StickyNote,
  Trash2,
} from 'lucide-react-native'
import { type ReactNode, useState } from 'react'
import { Text, View } from 'react-native'

import { ActionGrid } from '@/components/field/ActionGrid'
import { ChipSelect } from '@/components/field/ChipSelect'
import { DictationSheet } from '@/components/field/DictationSheet'
import { FieldHeader } from '@/components/field/FieldHeader'
import { ScaleField, type ScaleValue } from '@/components/field/ScaleField'
import { ShutterButton } from '@/components/field/ShutterButton'
import { StepperField } from '@/components/field/StepperField'
import { type Observed, TriStateField } from '@/components/field/TriStateField'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { IconButton } from '@/components/ui/IconButton'
import { ListItem } from '@/components/ui/ListItem'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Sheet'
import { SyncChip } from '@/components/ui/SyncChip'
import { TextField } from '@/components/ui/TextField'
import { Toast } from '@/components/ui/Toast'
import { formatLastInspection } from '@/lib/format'
import { successHaptic } from '@/lib/haptics'
import {
  pestLabels,
  populationStrengthLabels,
  temperamentLabels,
  weatherLabels,
} from '@/lib/labels'

/** Component gallery for judging sizes with gloves; release builds never reach it. */
export default function DesignRoute() {
  if (!__DEV__) return <Redirect href="/" />
  return <Gallery />
}

const noop = () => {}

function Gallery() {
  const [toast, setToast] = useState<string | null>(null)
  const [sheet, setSheet] = useState(false)
  const [dictation, setDictation] = useState(false)
  const [listening, setListening] = useState(false)
  const [name, setName] = useState('')
  const [strength, setStrength] = useState<ScaleValue | null>(3)
  const [temper, setTemper] = useState<ScaleValue | null>(null)
  const [queen, setQueen] = useState<Observed | null>(null)
  const [frames, setFrames] = useState<number | null>(null)
  const [weather, setWeather] = useState<string[]>(['sunny'])
  const [pests, setPests] = useState<string[]>([])

  const save = () => {
    successHaptic()
    setToast('Guardado en este dispositivo')
  }

  return (
    <View className="flex-1 bg-bg">
      <FieldHeader
        apiaryName="Vallecito 1"
        hiveName="C-12"
        lastInspection={formatLastInspection(new Date(Date.now() - 12 * 86_400_000).toISOString())}
        sync="saved"
        onBack={() => router.back()}
      />
      <Screen field topInset={false}>
        <Section title="Field · acciones">
          <ActionGrid
            actions={[
              { icon: Mic, label: 'Dictar', onPress: () => setDictation(true) },
              { icon: Camera, label: 'Foto', onPress: noop },
              { icon: StickyNote, label: 'Nota 1', onPress: noop },
              { icon: StickyNote, label: 'Nota 2', onPress: noop },
              { icon: Plus, label: 'Nota', onPress: noop },
              { icon: CircleCheck, label: 'Terminar', onPress: save, primary: true },
            ]}
          />
        </Section>

        <Section title="Field · controles">
          <ScaleField
            label="Fuerza de la colonia"
            value={strength}
            onChange={setStrength}
            words={populationStrengthLabels}
          />
          <ScaleField
            label="Temperamento"
            value={temper}
            onChange={setTemper}
            words={temperamentLabels}
          />
          <TriStateField label="Reina vista" value={queen} onChange={setQueen} />
          <StepperField
            label="Cuadros de cría"
            value={frames}
            onChange={setFrames}
            min={0}
            max={40}
          />
          <ChipSelect label="Clima" options={weatherLabels} value={weather} onChange={setWeather} />
          <ChipSelect
            label="Plagas"
            options={pestLabels}
            value={pests}
            onChange={setPests}
            multiple
          />
          <View className="rounded-card bg-deep py-6">
            <ShutterButton onPress={noop} />
          </View>
        </Section>

        <Section title="Botones">
          <Button label="Guardar" icon={Save} onPress={save} />
          <Button variant="accent" label="Nueva revisión" onPress={noop} />
          <Button variant="secondary" label="Abrir hoja" onPress={() => setSheet(true)} />
          <Button variant="danger" icon={Trash2} label="Eliminar colmena" onPress={noop} />
          <Button label="Guardando" loading onPress={noop} />
          <Button label="Desactivado" disabled onPress={noop} />
          <View className="flex-row gap-3">
            <IconButton icon={Hexagon} label="Colmena" onPress={noop} />
            <IconButton icon={Plus} label="Agregar" variant="accent" onPress={noop} />
          </View>
        </Section>

        <Section title="Estados de sincronización">
          <SyncChip state="saved" />
          <SyncChip state="pending" count={3} />
          <SyncChip state="synced" />
          <SyncChip state="attention" count={1} onPress={noop} />
          <View className="flex-row flex-wrap gap-2">
            <Badge label="Propietario" tone="primary" />
            <Badge label="Revisor" />
            <Badge label="Pronto" tone="accent" />
            <Badge label="Urgente" tone="danger" />
          </View>
        </Section>

        <Section title="Formularios y listas">
          <TextField
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="C-12"
            hint="Hasta 40 caracteres"
          />
          <TextField
            label="Correo"
            value="sin-arroba"
            error="Revisa el correo."
            onChangeText={noop}
          />
          <Card className="p-0">
            <ListItem
              icon={Hexagon}
              title="C-12"
              subtitle="Última revisión hace 3 días"
              onPress={noop}
            />
            <ListItem
              icon={Hexagon}
              title="C-13"
              subtitle="Sin revisiones"
              trailing={<Badge label="Urgente" tone="danger" />}
            />
          </Card>
        </Section>

        <Section title="Vacío y error">
          <Card>
            <EmptyState
              icon={Inbox}
              title="Crea tu primer apiario"
              body="Un apiario es un sitio de tu finca con sus colmenas."
              action={{ label: 'Crear apiario', onPress: noop }}
            />
          </Card>
          <Card>
            <ErrorState
              title="No pudimos cargar"
              body="Revisa tu conexión e inténtalo de nuevo."
              onRetry={noop}
            />
          </Card>
        </Section>
      </Screen>

      <Sheet visible={sheet} title="Hoja de ejemplo" onClose={() => setSheet(false)}>
        <Text className="font-sans text-body text-text">Las hojas se cierran tocando afuera.</Text>
        <Button label="Cerrar" onPress={() => setSheet(false)} />
      </Sheet>
      <DictationSheet
        visible={dictation}
        listening={listening}
        transcript={listening ? 'Reina vista, cuatro cuadros de cría' : ''}
        onToggleListening={() => setListening((on) => !on)}
        onUse={() => setDictation(false)}
        onClose={() => {
          setListening(false)
          setDictation(false)
        }}
      />
      <Toast message={toast} onHide={() => setToast(null)} onUndo={noop} />
    </View>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="font-display text-section text-text">
        {title}
      </Text>
      {children}
    </View>
  )
}
