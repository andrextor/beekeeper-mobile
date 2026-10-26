import * as Haptics from 'expo-haptics'

export const tapHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

/** Light tap feedback, then the action: every field control does this. */
export const withTap = (action: () => void) => () => {
  tapHaptic()
  action()
}

export const successHaptic = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
