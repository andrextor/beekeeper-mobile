import { Redirect, router } from 'expo-router'
import { type BottomTabBarButtonProps, Tabs } from 'expo-router/tabs'
import {
  CloudUpload,
  House,
  type LucideIcon,
  MapPin,
  ScanQrCode,
  UserRound,
} from 'lucide-react-native'
import { useEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Photo eviction registers itself to run after every full sync (M9).
import '@/features/photos/evict'
import { PressScale } from '@/components/ui/PressScale'
import { useSession } from '@/features/auth/session'
import { takeWaitingLink } from '@/features/qr/pending-link'
import { useSyncTriggers } from '@/features/sync/triggers'
import { useSyncStatus } from '@/features/sync/useSyncStatus'
import { cx } from '@/lib/cx'
import { tapHaptic } from '@/lib/haptics'
import { color, iconSize, iconStroke, shadow } from '@/lib/theme'

const tabIcon =
  (Icon: LucideIcon) =>
  ({ focused }: { focused: boolean }) => (
    // Material 3 indicator: the active tab sits on a soft green pill.
    <View
      className={cx(
        'h-8 w-16 items-center justify-center rounded-button',
        focused && 'bg-primary-soft',
      )}
    >
      <Icon
        color={focused ? color.onPrimarySoft : color.muted}
        size={iconSize.standard}
        strokeWidth={focused ? iconStroke.field : iconStroke.standard}
      />
    </View>
  )

/** DESIGN.md: the center tab is a 72-dp honey circle that rises above the bar. */
function ScanTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <View className="flex-1 items-center">
      <PressScale
        accessibilityRole="button"
        accessibilityLabel="Escanear QR"
        accessibilityState={accessibilityState}
        onPress={(e) => {
          tapHaptic()
          onPress?.(e)
        }}
        className="-mt-7 size-field items-center justify-center rounded-full border-4 border-bg bg-accent"
        style={shadow.raised}
      >
        <ScanQrCode color={color.onAccent} size={iconSize.field} strokeWidth={iconStroke.field} />
      </PressScale>
    </View>
  )
}

export default function TabsLayout() {
  const { state } = useSession()

  // "/" is where the app opens: send each auth state to its entry screen.
  if (state.status !== 'signedIn') return <Redirect href="/(auth)/welcome" />
  if (state.memberships.length === 0) return <Redirect href="/(auth)/onboarding" />
  if (!state.activeOrganizationId) return <Redirect href="/organizations" />

  return <SyncedTabs />
}

/** Sync runs while the tabs exist: signed in with a finca. */
function SyncedTabs() {
  const insets = useSafeAreaInsets()
  useSyncTriggers()
  // A label scanned with the system camera before signing in opens now.
  useEffect(() => {
    const code = takeWaitingLink()
    if (code) router.push({ pathname: '/h/[code]', params: { code } })
  }, [])
  const { pending, attention } = useSyncStatus()
  const waiting = pending + attention

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // The tab bar would ride up on the keyboard and cover the field being typed in.
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: color.onPrimarySoft,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
        // Room for the 64×32 active pill; the default wrapper is a 24-dp square.
        tabBarIconStyle: { width: 64, height: 32 },
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 8,
          backgroundColor: color.bg,
          borderTopWidth: 0,
          ...shadow.tabBar,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen name="apiaries" options={{ title: 'Apiarios', tabBarIcon: tabIcon(MapPin) }} />
      <Tabs.Screen
        name="scan"
        options={{ title: 'Escanear', tabBarButton: (props) => <ScanTabButton {...props} /> }}
      />
      <Tabs.Screen
        name="pending"
        options={{
          title: 'Pendientes',
          tabBarIcon: tabIcon(CloudUpload),
          tabBarBadge: waiting > 0 ? waiting : undefined,
          tabBarBadgeStyle: {
            backgroundColor: attention > 0 ? color.danger : color.accent,
            color: attention > 0 ? color.onDanger : color.onAccent,
          },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  )
}
