import * as Haptics from 'expo-haptics'

export const tapHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

export const successHaptic = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
