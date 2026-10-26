import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

import { useRole, useSession } from '@/features/auth/session'
import { ScannerView } from '@/features/qr/ScannerView'
import { ScanOutcome } from '@/features/qr/ScanOutcome'
import { useCodeLookup } from '@/features/qr/useCodeLookup'

export default function ScanScreen() {
  const { state, setActiveOrganization } = useSession()
  const owner = useRole() === 'owner'
  const [focused, setFocused] = useState(false)
  const memberships = state.status === 'signedIn' ? state.memberships : []
  const lookup = useCodeLookup({
    isOwner: owner,
    activeOrganizationId: state.status === 'signedIn' ? state.activeOrganizationId : null,
    fincaName: (id) =>
      memberships.find((m) => m.organization_id === id)?.organization_name ?? 'otra finca',
    switchFinca: setActiveOrganization,
  })

  // The camera runs only while this tab is on screen (battery); coming back starts a fresh scan.
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => {
        setFocused(false)
        lookup.reset()
      }
    }, [lookup.reset]),
  )

  if (lookup.state.kind !== 'idle') {
    return (
      <ScanOutcome
        state={lookup.state}
        onRescan={lookup.reset}
        onAssign={(code) => router.push({ pathname: '/qr/assign', params: { code } })}
      />
    )
  }
  return focused ? <ScannerView onCode={(code) => void lookup.open(code)} /> : null
}
