import { type Member, sortMembers } from './api'

jest.mock('@/lib/supabase', () => ({ supabase: {} }))

const member = (user_id: string, role: Member['role'], name: string | null, email: string) => ({
  user_id,
  role,
  profiles: { email, display_name: name, deactivated_at: null },
})

describe('sortMembers', () => {
  it('puts owners first, then sorts by name or email', () => {
    const sorted = sortMembers([
      member('1', 'reviewer', 'Zoe', 'z@x.co'),
      member('2', 'reviewer', null, 'ana@x.co'),
      member('3', 'owner', 'Pedro', 'p@x.co'),
      member('4', 'reviewer', 'Ángel', 'a@x.co'),
      member('5', 'viewer', 'Bea', 'b@x.co'),
    ])
    expect(sorted.map((m) => m.user_id)).toEqual(['3', '2', '4', '5', '1'])
  })

  it('keeps a member whose profile is not readable', () => {
    const hidden: Member = { user_id: '9', role: 'reviewer', profiles: null }
    expect(sortMembers([hidden, member('1', 'owner', 'A', 'a@x.co')])).toHaveLength(2)
  })
})
