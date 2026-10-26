import { useKeepAwake } from 'expo-keep-awake'
import { CircleCheck, Plus, StickyNote, TriangleAlert } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, type ScrollViewInstance, Text, View } from 'react-native'

import { ActionGrid } from '@/components/field/ActionGrid'
import { FieldHeader } from '@/components/field/FieldHeader'
import { FormError } from '@/components/ui/FormError'
import { getDb } from '@/db/database'
import { messageFor } from '@/lib/errors'
import { successHaptic } from '@/lib/haptics'
import { uuid } from '@/lib/ids'
import { color, iconSize } from '@/lib/theme'
import { type Draft, type DraftNote, nextSlot, updateDraft } from './drafts'
import { FieldSections, fieldPlaces, type SectionKey } from './FieldSections'
import { type Finished, finishDraft } from './finish'
import { NoteSheet } from './NoteSheet'
import type { InspectionDraft } from './schema'

// A closed section stays closed for the rest of the app session (not stored).
const sessionOpen: Record<SectionKey, boolean> = {
  colony: true,
  brood: true,
  health: true,
  work: true,
}

const autosaveMs = 300

type Sheet = { kind: 'slot'; slot: number } | { kind: 'inspection' } | null

type Props = {
  draft: Draft
  apiaryName: string
  hiveName: string
  lastInspection: string
  userId: string
  today: string
  onBack: () => void
  onFinished: (finished: Finished) => void
}

const firstWords = (text: string) => (text.length > 18 ? `${text.slice(0, 18)}…` : text)

/** Field mode (spec M7): big taps only, autosaved draft, notes, Terminar. */
export function FieldInspection({
  draft,
  apiaryName,
  hiveName,
  lastInspection,
  userId,
  today,
  onBack,
  onFinished,
}: Props) {
  useKeepAwake()
  const [fields, setFields] = useState(draft.fields)
  const [notes, setNotes] = useState<DraftNote[]>(draft.notes)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [open, setOpen] = useState(sessionOpen)
  const [problems, setProblems] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const scroll = useRef<ScrollViewInstance>(null)
  const positions = useRef<Partial<Record<SectionKey, number>>>({})

  // Autosave: the draft follows every change 300 ms later, and is flushed when the screen goes.
  // The latest values live in refs so two changes in one tick never save a stale half.
  const latest = useRef({ fields: draft.fields, notes: draft.notes })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)
  const flush = async () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (!dirty.current) return
    dirty.current = false
    const { fields: f, notes: n } = latest.current
    await updateDraft(await getDb(), draft.id, f, n)
  }
  const schedule = () => {
    dirty.current = true
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), autosaveMs)
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: flush once on unmount only
  useEffect(() => () => void flush(), [])

  const change = (patch: Partial<InspectionDraft>) => {
    latest.current = { ...latest.current, fields: { ...latest.current.fields, ...patch } }
    setFields(latest.current.fields)
    schedule()
  }
  const changeNotes = (next: DraftNote[]) => {
    latest.current = { ...latest.current, notes: next }
    setNotes(next)
    schedule()
  }

  const noteIn = (slot: number) => notes.find((n) => n.slot === slot)
  const saveNote = (slot: number, text: string) => {
    const current = latest.current.notes
    changeNotes(
      current.some((n) => n.slot === slot)
        ? current.map((n) => (n.slot === slot ? { ...n, text } : n))
        : [...current, { id: uuid(), slot, text, source: 'text', at: new Date().toISOString() }],
    )
    setSheet(null)
  }

  const finish = async () => {
    if (saving) return
    setSaving(true)
    setFailure(null)
    try {
      // Whatever Terminar decides, the draft first holds every tap made before it.
      await flush()
      const { fields: f, notes: n } = latest.current
      const outcome = await finishDraft(await getDb(), { ...draft, fields: f, notes: n }, userId)
      if (!outcome.ok) {
        setProblems(outcome.problems)
        scroll.current?.scrollTo({ y: 0, animated: true })
        return
      }
      successHaptic()
      onFinished(outcome.finished)
    } catch (e) {
      setFailure(`No se pudo guardar la revisión: ${messageFor(e)} Sigue en este borrador.`)
      scroll.current?.scrollTo({ y: 0, animated: true })
    } finally {
      setSaving(false)
    }
  }

  const goTo = (section: SectionKey) => {
    sessionOpen[section] = true
    setOpen({ ...sessionOpen })
    // Wait for the section to open before scrolling to it.
    setTimeout(
      () => scroll.current?.scrollTo({ y: positions.current[section] ?? 0, animated: true }),
      50,
    )
  }

  const slotTile = (slot: number) => ({
    icon: StickyNote,
    label: `Nota ${slot}`,
    detail: noteIn(slot) ? firstWords(noteIn(slot)?.text ?? '') : undefined,
    onPress: () => setSheet({ kind: 'slot', slot }),
  })
  const extraNotes = notes.filter((n) => n.slot >= 3).sort((a, b) => a.slot - b.slot)
  const sheetSlot = sheet?.kind === 'slot' ? sheet.slot : null

  return (
    <View className="flex-1 bg-bg">
      <FieldHeader
        apiaryName={apiaryName}
        hiveName={hiveName}
        lastInspection={lastInspection}
        sync="saved"
        onBack={onBack}
      />
      <ScrollView
        ref={scroll}
        contentContainerClassName="gap-8 p-4 pb-16"
        keyboardShouldPersistTaps="handled"
      >
        <FormError message={failure} />
        {Object.keys(problems).length ? (
          <View accessibilityRole="alert" className="gap-3 rounded-card border-2 border-danger p-4">
            <View className="flex-row items-center gap-2">
              <TriangleAlert color={color.danger} size={iconSize.field} />
              <Text className="flex-1 font-sans-semibold text-field-label text-text">
                Revisa antes de terminar
              </Text>
            </View>
            {Object.entries(problems).map(([field, message]) => {
              const place = fieldPlaces[field]
              return (
                <Pressable
                  key={field}
                  accessibilityRole="button"
                  onPress={() => place && goTo(place.section)}
                  className="min-h-target justify-center rounded-button bg-stone-100 px-4 py-2 active:opacity-70"
                >
                  <Text className="font-sans-semibold text-body text-text">
                    {place?.label ?? field}
                  </Text>
                  <Text className="font-sans text-body text-text">{`${message} · Ir al campo`}</Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
        <ActionGrid
          actions={[
            slotTile(1),
            slotTile(2),
            {
              icon: Plus,
              label: 'Nota',
              onPress: () => setSheet({ kind: 'slot', slot: nextSlot(notes) }),
            },
            {
              icon: CircleCheck,
              label: saving ? 'Guardando…' : 'Terminar',
              onPress: () => void finish(),
              primary: true,
            },
          ]}
        />
        {extraNotes.map((n) => (
          <Pressable
            key={n.id}
            accessibilityRole="button"
            onPress={() => setSheet({ kind: 'slot', slot: n.slot })}
            className="min-h-target justify-center rounded-card border border-border bg-surface px-4 py-2 active:opacity-70"
          >
            <Text
              numberOfLines={2}
              className="font-sans text-body text-text"
            >{`Nota ${n.slot}: ${n.text}`}</Text>
          </Pressable>
        ))}
        <FieldSections
          fields={fields}
          onChange={change}
          today={today}
          open={open}
          onToggle={(section) => {
            sessionOpen[section] = !sessionOpen[section]
            setOpen({ ...sessionOpen })
          }}
          onLayoutSection={(section, y) => {
            positions.current[section] = y
          }}
          onWriteNotes={() => setSheet({ kind: 'inspection' })}
        />
      </ScrollView>

      <NoteSheet
        title={sheetSlot ? `Nota ${sheetSlot}` : 'Notas de la revisión'}
        visible={sheet !== null}
        initial={sheetSlot ? (noteIn(sheetSlot)?.text ?? '') : (fields.notes ?? '')}
        max={sheetSlot ? 2000 : 4000}
        onClose={() => setSheet(null)}
        onSave={(text) => {
          if (sheetSlot) return saveNote(sheetSlot, text)
          change({ notes: text })
          setSheet(null)
        }}
        onDelete={
          sheetSlot && noteIn(sheetSlot)
            ? () => {
                changeNotes(latest.current.notes.filter((n) => n.slot !== sheetSlot))
                setSheet(null)
              }
            : !sheetSlot && fields.notes
              ? () => {
                  change({ notes: null })
                  setSheet(null)
                }
              : undefined
        }
      />
    </View>
  )
}
