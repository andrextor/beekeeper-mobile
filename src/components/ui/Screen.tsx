import { useFocusEffect } from 'expo-router'
import { setStatusBarStyle } from 'expo-status-bar'
import { type ReactNode, useCallback } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cx } from '@/lib/cx'
import { HoneycombPattern } from './HoneycombPattern'

type Hero = { title: string; eyebrow?: string | null; children?: ReactNode }

type Props = {
  children: ReactNode
  /** Lists render their own FlatList; everything else scrolls here. */
  scroll?: boolean
  /** Field mode uses pure white for maximum contrast. */
  field?: boolean
  /** False under a header that already pads the status bar (FieldHeader). */
  topInset?: boolean
  /** A `deep` band with the honeycomb pattern on top; the content rises over it as a sheet. */
  hero?: Hero
}

/** For screens with a dark top: light status-bar icons while the screen is in front. */
export function useLightStatusBar() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light')
      return () => setStatusBarStyle('dark')
    }, []),
  )
}

function HeroBand({ title, eyebrow, children }: Hero) {
  const insets = useSafeAreaInsets()
  useLightStatusBar()
  return (
    <View style={{ paddingTop: insets.top + 24 }} className="overflow-hidden bg-deep px-4 pb-12">
      <HoneycombPattern />
      <View className="gap-1.5">
        {eyebrow ? (
          <Text className="font-sans-semibold text-caption text-mist">{eyebrow}</Text>
        ) : null}
        <Text accessibilityRole="header" className="font-display text-title text-white">
          {title}
        </Text>
        {children}
      </View>
    </View>
  )
}

/** The hero band as a list header: the list's 16 dp padding is cancelled so the band bleeds. */
export function ListHero({ hero, children }: { hero: Hero; children?: ReactNode }) {
  return (
    <View className="-mx-4 -mt-4 pb-4">
      <HeroBand {...hero} />
      <View className="-mt-6 gap-4 rounded-t-sheet bg-bg-soft px-4 pt-6">{children}</View>
    </View>
  )
}

export function Screen({ children, scroll = true, field = false, topInset = true, hero }: Props) {
  const insets = useSafeAreaInsets()
  const content = cx('gap-4 p-4', hero && '-mt-6 rounded-t-sheet bg-bg-soft pt-6')
  return (
    <View
      style={{ paddingTop: topInset && !hero ? insets.top : 0 }}
      className={cx('flex-1', field ? 'bg-bg' : 'bg-bg-soft')}
    >
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-8">
          {hero ? <HeroBand {...hero} /> : null}
          <View className={content}>{children}</View>
        </ScrollView>
      ) : (
        <View className="flex-1">
          {hero ? <HeroBand {...hero} /> : null}
          <View className={cx('flex-1', content)}>{children}</View>
        </View>
      )}
    </View>
  )
}
