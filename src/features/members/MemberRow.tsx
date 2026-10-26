import { UserRound } from 'lucide-react-native'
import { View } from 'react-native'

import { Badge } from '@/components/ui/Badge'
import { ListItem } from '@/components/ui/ListItem'
import { RoleBadge } from '@/features/auth/RoleBadge'
import type { Member } from './api'

type Props = { member: Member; me: boolean; onPress?: () => void }

export function memberName(member: Member): string {
  return member.profiles?.display_name || member.profiles?.email || 'Persona sin perfil visible'
}

export function MemberRow({ member, me, onPress }: Props) {
  const email = member.profiles?.display_name ? member.profiles.email : undefined
  const subtitle = [me ? 'Tú' : null, email].filter(Boolean).join(' · ')
  return (
    <ListItem
      icon={UserRound}
      title={memberName(member)}
      subtitle={subtitle || undefined}
      trailing={
        <View className="items-end gap-1">
          <RoleBadge role={member.role} />
          {member.profiles?.deactivated_at ? <Badge label="Desactivado" tone="danger" /> : null}
        </View>
      }
      onPress={onPress}
    />
  )
}
