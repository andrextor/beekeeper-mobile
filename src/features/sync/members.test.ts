import { canRecord, parseMemberships } from './members'

jest.mock('@/lib/supabase', () => ({ supabase: {} }))

const finca = (role: string) => ({ organization_id: 'a', organization_name: 'Finca a', role })

describe('parseMemberships', () => {
  it('keeps the observador role', () => {
    expect(parseMemberships([finca('viewer')])[0]?.role).toBe('viewer')
  })

  it('reads a role it does not know as observador instead of dropping the fincas', () => {
    expect(parseMemberships([finca('auditor'), finca('owner')]).map((m) => m.role)).toEqual([
      'viewer',
      'owner',
    ])
  })
})

describe('canRecord', () => {
  it('lets owners and reviewers write, never an observador', () => {
    expect(canRecord('owner')).toBe(true)
    expect(canRecord('reviewer')).toBe(true)
    expect(canRecord('viewer')).toBe(false)
    expect(canRecord(null)).toBe(false)
  })
})
