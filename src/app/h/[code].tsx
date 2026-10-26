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
  const { state: found, open } = useCodeLookup({
    isOwner: owner,
    memberships: state.status === 'signedIn' ? state.memberships : [],
    activeOrganizationId: state.status === 'signedIn' ? state.activeOrganizationId : null,
    switchFinca: setActiveOrganization,
    replace: true,
  })

  const loading = state.status === 'loading'
  useEffect(() => {
    if (loading || !code) return
    if (signedIn) void open(code)
    // Signed out or still without a finca: the tabs open it once they mount.
    else keepLinkForLater(code)
  }, [loading, signedIn, code, open])

  if (loading) return null
  if (!code || !signedIn) return <Redirect href="/" />
  if (found.kind === 'idle') return null
  return (
    <ScanOutcome
      state={found}
      onRescan={() => router.replace('/scan')}
      onAssign={(c) => router.replace({ pathname: '/qr/assign', params: { code: c } })}
    />
  )
}
