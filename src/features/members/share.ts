import { Linking, Share } from 'react-native'

/** WhatsApp straight away; without it (or if it refuses) the system share menu. */
export async function shareByWhatsApp(message: string): Promise<void> {
  try {
    await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`)
  } catch {
    await Share.share({ message })
  }
}
