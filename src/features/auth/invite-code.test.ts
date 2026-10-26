import { formatInviteCode, isCompleteInviteCode } from './invite-code'

describe('formatInviteCode', () => {
  it('uppercases and inserts the dash as the person types', () => {
    expect(formatInviteCode('k7m')).toBe('K7M')
    expect(formatInviteCode('k7m2')).toBe('K7M2')
    expect(formatInviteCode('k7m29')).toBe('K7M2-9')
    expect(formatInviteCode('k7m29qxa')).toBe('K7M2-9QXA')
  })

  it('cleans a code pasted from WhatsApp', () => {
    expect(formatInviteCode(' K7M2 - 9QXA. ')).toBe('K7M2-9QXA')
    expect(
      formatInviteCode(
        'Te invité a Finca Landak en Landak Apiario. Escribe este código: K7M2-9QXA. Vence el 1 de noviembre.',
      ),
    ).toBe('K7M2-9QXA')
    expect(formatInviteCode('Escribe este código: K7M29QXA')).toBe('K7M2-9QXA')
  })

  it('caps at 8 characters and knows when it is complete', () => {
    expect(formatInviteCode('K7M2-9QXA-ZZ')).toBe('K7M2-9QXA')
    expect(isCompleteInviteCode('K7M2-9QXA')).toBe(true)
    expect(isCompleteInviteCode('K7M2-9QX')).toBe(false)
  })
})
