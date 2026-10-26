import { roleLabels } from '@/lib/labels'
import { Badge } from './Badge'

export function RoleBadge({ role }: { role: keyof typeof roleLabels }) {
  return <Badge label={roleLabels[role]} tone={role === 'owner' ? 'primary' : 'neutral'} />
}
