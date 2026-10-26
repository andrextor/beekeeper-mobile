import { formatDate } from '@/lib/format'

/** The text the owner sends by WhatsApp; M12 adds the install link. */
export function inviteMessage(finca: string, code: string, expiresAt: string): string {
  return `Te invité a ${finca} en Landak Apiario. Instala la app, crea tu cuenta y escribe este código: ${code}. Vence el ${formatDate(expiresAt)}.`
}
