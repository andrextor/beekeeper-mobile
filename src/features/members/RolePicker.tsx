import { Text } from 'react-native'

import { ChipSelect } from '@/components/field/ChipSelect'
import type { Role } from '@/features/sync/members'
import { roleLabels } from '@/lib/labels'

const roleHelp: Record<Role, string> = {
  owner: 'Puede hacer todo, incluso invitar y quitar personas.',
  reviewer:
    'Puede ver todo y registrar revisiones, notas, fotos y actividades. No puede cambiar apiarios ni colmenas.',
  viewer:
    'Puede ver toda la finca: colmenas, revisiones, actividades, notas y fotos. No registra ni cambia nada.',
}

const isRole = (value: unknown): value is Role => typeof value === 'string' && value in roleHelp

/** The three roles as chips, with one line on what the chosen one allows. */
export function RolePicker({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <>
      <ChipSelect
        label="Rol"
        options={roleLabels}
        value={[value]}
        onChange={(v) => {
          if (isRole(v[0])) onChange(v[0])
        }}
      />
      <Text className="font-sans text-body text-muted">{roleHelp[value]}</Text>
    </>
  )
}
