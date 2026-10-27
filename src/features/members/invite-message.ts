import { formatDate } from '@/lib/format'
import { apkUrl } from '@/lib/releases'

/** The text the owner sends by WhatsApp. */
export function inviteMessage(finca: string, code: string, expiresAt: string): string {
  return `Te invité a ${finca} en Landak Apiario. Instala la app (${apkUrl}), crea tu cuenta y escribe este código: ${code}. Vence el ${formatDate(expiresAt)}.`
}
