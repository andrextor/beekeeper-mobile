import { formatDate } from '@/lib/format'
import { apkUrl } from '@/lib/releases'
import { inviteMessage } from './invite-message'

describe('inviteMessage', () => {
  it('names the finca, the install link, the code and the expiry day', () => {
    const at = '2026-11-02T15:00:00.000Z'
    expect(inviteMessage('Finca Landak', 'K7M2-9QXA', at)).toBe(
      `Te invité a Finca Landak en Landak Apiario. Instala la app (${apkUrl}), crea tu cuenta y escribe este código: K7M2-9QXA. Vence el ${formatDate(at)}.`,
    )
  })
})
