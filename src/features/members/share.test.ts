import { Linking, Share } from 'react-native'

import { shareByWhatsApp } from './share'

jest.mock('react-native', () => ({
  Linking: { openURL: jest.fn() },
  Share: { share: jest.fn() },
}))

const openURL = jest.mocked(Linking.openURL)
const share = jest.mocked(Share.share)

describe('shareByWhatsApp', () => {
  beforeEach(() => jest.clearAllMocks())

  it('opens WhatsApp with the message encoded', async () => {
    openURL.mockResolvedValue(true)
    await shareByWhatsApp('Código: K7M2 & más')
    expect(openURL).toHaveBeenCalledWith(
      `whatsapp://send?text=${encodeURIComponent('Código: K7M2 & más')}`,
    )
    expect(share).not.toHaveBeenCalled()
  })

  it('falls back to the share menu when WhatsApp is missing', async () => {
    openURL.mockRejectedValue(new Error('No Activity found'))
    share.mockResolvedValue({ action: 'sharedAction' })
    await shareByWhatsApp('hola')
    expect(share).toHaveBeenCalledWith({ message: 'hola' })
  })
})
