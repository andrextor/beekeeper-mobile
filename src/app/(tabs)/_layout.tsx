import { Redirect } from 'expo-router'
import { type BottomTabBarButtonProps, Tabs } from 'expo-router/tabs'
import {
  CloudUpload,
  House,
  type LucideIcon,
  MapPin,
  ScanQrCode,
  UserRound,
} from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSession } from '@/features/auth/session'
import { tapHaptic } from '@/lib/haptics'
import { color, iconSize, iconStroke } from '@/lib/theme'

const tabIcon =
  (Icon: LucideIcon) =>
  ({ focused }: { focused: boolean }) => (
    <Icon color={focused ? color.primary : color.muted} size={iconSize.standard} />
  )

/** DESIGN.md: the center tab is a 72-dp honey circle that rises above the bar. */
function ScanTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <View className="flex-1 items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escanear QR"
        accessibilityState={accessibilityState}
        onPress={(e) => {
          tapHaptic()
          onPress?.(e)
        }}
        className="-mt-6 size-field items-center justify-center rounded-full border-4 border-bg bg-accent active:opacity-80"
      >
        <ScanQrCode color={color.onAccent} size={iconSize.field} strokeWidth={iconStroke.field} />
      </Pressable>
    </View>
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const { state } = useSession()

  // "/" is where the app opens: send each auth state to its entry screen.
  if (state.status !== 'signedIn') return <Redirect href="/(auth)/welcome" />
  if (state.memberships.length === 0) return <Redirect href="/(auth)/onboarding" />
  if (!state.activeOrganizationId) return <Redirect href="/organizations" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 6,
          backgroundColor: color.bg,
          borderTopColor: color.border,
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
        options={{ title: 'Pendientes', tabBarIcon: tabIcon(CloudUpload) }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: tabIcon(UserRound) }} />
    </Tabs>
  )
}
