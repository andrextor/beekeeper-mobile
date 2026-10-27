import { Eye } from 'lucide-react-native'

import { NotAvailable } from '@/components/ui/NotAvailable'

/** Shown on a write route opened by an observador (a deep link or an old back stack). */
export function ReadOnly() {
  return (
    <NotAvailable
      icon={Eye}
      title="Como observador puedes ver la finca, pero no registrar cambios."
    />
  )
}
