import { ClipboardCheck } from 'lucide-react-native'

import { NotAvailable } from '@/components/ui/NotAvailable'

// M7 replaces this screen with field mode.
export default function InspectScreen() {
  return (
    <NotAvailable icon={ClipboardCheck} title="La revisión en campo llega en la próxima versión." />
  )
}
