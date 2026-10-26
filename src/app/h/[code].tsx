import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'

import { useRole, useSession } from '@/features/auth/session'
import { keepLinkForLater } from '@/features/qr/pending-link'
import { ScanOutcome } from '@/features/qr/ScanOutcome'
import { useCodeLookup } from '@/features/qr/useCodeLookup'
import { parseQrPayload } from '@/lib/qr-code'

/** `landak://h/<code>` from the system camera: same lookup as the scanner, then the hive. */
export default function HiveLinkScreen() {
  const { code: raw } = useLocalSearchParams<{ code: string }>()
  const code = parseQrPayload(raw ?? '')
  const { state, setActiveOrganization } = useSession()
  const owner = useRole() === 'owner'
  const signedIn = state.status === 'signedIn' && state.memberships.length > 0
  const memberships = state.status === 'signedIn' ? state.memberships : []
  const { state: found, open } = useCodeLookup({
    isOwner: owner,
    activeOrganizationId: state.status === 'signedIn' ? state.activeOrganizationId : null,
    fincaName: (id) =>
      memberships.find((m) => m.organization_id === id)?.organization_name ?? 'otra finca',
    switchFinca: setActiveOrganization,
    replace: true,
  })

  useEffect(() => {
    if (signedIn && code) void open(code)
  }, [signedIn, code, open])

  if (state.status === 'loading') return null
  if (!code) return <Redirect href="/" />
  if (!signedIn) {
    keepLinkForLater(code)
    return <Redirect href="/" />
  }
  if (found.kind === 'idle') return null
  return (
    <ScanOutcome
      state={found}
      onRescan={() => router.replace('/scan')}
      onAssign={(c) => router.replace({ pathname: '/qr/assign', params: { code: c } })}
    />
  )
}
