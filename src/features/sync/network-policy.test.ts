import { canUploadPhotos } from './network-policy'

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
  NetworkStateType: { WIFI: 'WIFI' },
}))

describe('canUploadPhotos', () => {
  it('uploads on Wi-Fi, on mobile data only when allowed or asked once', () => {
    expect(canUploadPhotos(true, false, false)).toBe(true)
    expect(canUploadPhotos(false, false, false)).toBe(false)
    expect(canUploadPhotos(false, true, false)).toBe(true)
    expect(canUploadPhotos(false, false, true)).toBe(true)
  })
})
