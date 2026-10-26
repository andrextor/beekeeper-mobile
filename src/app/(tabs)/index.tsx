import { router } from 'expo-router'
import { CalendarClock, CircleCheck, ListTodo, ScanQrCode } from 'lucide-react-native'
import { type ReactNode, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListItem } from '@/components/ui/ListItem'
import { Screen } from '@/components/ui/Screen'
import { useLocalRead } from '@/db/useLocalQuery'
import { useSession } from '@/features/auth/session'
import { hivesToVisit, latestInspections, openTasks, recentActivity } from '@/features/hives/home'
import { localDay } from '@/features/hives/schema'
import { formatRelative, plural } from '@/lib/format'

const shown = 50

const openHive = (id: string) => router.push({ pathname: '/hive/[id]', params: { id } })

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-display text-section text-text">
        {title}
      </Text>
      {children}
    </View>
  )
}

/** Inicio: which hives need a visit, the open tasks and the latest activity, all from the phone. */
export default function HomeScreen() {
  const { state } = useSession()
  const organizationId = state.status === 'signedIn' ? (state.activeOrganizationId ?? '') : ''
  const finca =
    state.status === 'signedIn'
      ? state.memberships.find((m) => m.organization_id === organizationId)?.organization_name
      : undefined
  const today = localDay()
  const [openTask, setOpenTask] = useState<string | null>(null)

  const { data, loading } = useLocalRead(
    async (db) => {
      const latest = await latestInspections(db, organizationId)
      return {
        visits: hivesToVisit(latest, today),
        tasks: openTasks(latest),
        activity: await recentActivity(db, organizationId),
      }
    },
    `${organizationId}:${today}`,
    ['hives', 'apiaries', 'inspections', 'hive_events'],
  )

  if (loading || !data) return <Screen>{null}</Screen>
  const { visits, tasks, activity } = data
  const allClear = visits.length === 0 && tasks.length === 0

  return (
    <Screen>
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-display text-title text-text">
          Inicio
        </Text>
        {finca ? <Text className="font-sans text-body text-muted">{finca}</Text> : null}
      </View>

      {allClear ? (
        <Card>
          <EmptyState
            icon={CircleCheck}
            title="Todo al día"
            body="Ninguna colmena pide visita ni tiene tareas pendientes."
          />
        </Card>
      ) : null}

      {visits.length ? (
        <Section title="Para revisar">
          <Card className="p-0">
            {visits.slice(0, shown).map((v) => (
              <ListItem
                key={v.hiveId}
                icon={CalendarClock}
                title={v.apiaryName ? `${v.hiveName} · ${v.apiaryName}` : v.hiveName}
                subtitle={v.reason}
                onPress={() => openHive(v.hiveId)}
              />
            ))}
          </Card>
        </Section>
      ) : null}

      {tasks.length ? (
        <Section title="Tareas">
          <Card className="p-0">
            {tasks.map((t) => (
              <View key={t.action}>
                <ListItem
                  icon={ListTodo}
                  title={`${t.label} · ${plural(t.hives.length, 'colmena', 'colmenas')}`}
                  onPress={() => setOpenTask(openTask === t.action ? null : t.action)}
                />
                {openTask === t.action
                  ? t.hives
                      .slice(0, shown)
                      .map((h) => (
                        <ListItem
                          key={h.id}
                          title={`   ${h.name}`}
                          onPress={() => openHive(h.id)}
                        />
                      ))
                  : null}
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      {activity.length ? (
        <Section title="Última actividad">
          <Card className="p-0">
            {activity.map((a) => (
              <ListItem
                key={a.id}
                title={`${a.hiveName} · ${formatRelative(a.at)}`}
                subtitle={a.line}
                onPress={() =>
                  a.inspection
                    ? router.push({ pathname: '/inspection/[id]', params: { id: a.id } })
                    : openHive(a.hiveId)
                }
              />
            ))}
          </Card>
        </Section>
      ) : null}

      <Button
        variant="accent"
        icon={ScanQrCode}
        label="Escanear colmena"
        className="min-h-field"
        onPress={() => router.navigate('/scan')}
      />
    </Screen>
  )
}
