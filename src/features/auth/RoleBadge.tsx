import { Badge } from '@/components/ui/Badge'
import { roleLabels } from '@/lib/labels'
import type { Role } from './memberships'

export function RoleBadge({ role }: { role: Role }) {
  return <Badge label={roleLabels[role]} tone={role === 'owner' ? 'primary' : 'neutral'} />
}
