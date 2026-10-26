import { type Membership, pickActive } from './memberships'

jest.mock('@/lib/supabase', () => ({ supabase: {} }))
jest.mock('@react-native-async-storage/async-storage', () => ({}))
jest.mock('expo-secure-store', () => ({}))

const finca = (id: string): Membership => ({
  organization_id: id,
  organization_name: `Finca ${id}`,
  role: 'owner',
})

describe('pickActive', () => {
  it('keeps the stored finca while still a member', () => {
    expect(pickActive([finca('a'), finca('b')], 'b')).toBe('b')
  })

  it('falls back to the only finca', () => {
    expect(pickActive([finca('a')], 'gone')).toBe('a')
    expect(pickActive([finca('a')], null)).toBe('a')
  })

  it('lets the person choose among several, and has nothing without fincas', () => {
    expect(pickActive([finca('a'), finca('b')], null)).toBeNull()
    expect(pickActive([finca('a'), finca('b')], 'gone')).toBeNull()
    expect(pickActive([], 'a')).toBeNull()
  })
})
