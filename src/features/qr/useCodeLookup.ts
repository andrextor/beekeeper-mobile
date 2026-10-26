import { router } from 'expo-router'
import { useCallback, useRef, useState } from 'react'

import { showToast } from '@/components/ui/ToastHost'
import type { Membership } from '@/features/sync/members'
import { successHaptic } from '@/lib/haptics'
import { findHive } from './find'
import type { LookupOutcome } from './lookup'

export type LookupState =
  | { kind: 'idle' }
  | { kind: 'looking' }
  | (Exclude<LookupOutcome, { kind: 'found' }> & { code: string })

/** What the routes read from the session (`features/qr` never imports `auth`). */
type Options = {
  isOwner: boolean
  memberships: readonly Membership[]
  activeOrganizationId: string | null
  switchFinca: (organizationId: string) => Promise<void>
  /** The deep link replaces itself with the hive; the scanner pushes it. */
  replace?: boolean
}

/** Scanner and deep link: find the code, switch finca if needed, open the hive or say why not. */
export function useCodeLookup(options: Options) {
  const [state, setState] = useState<LookupState>({ kind: 'idle' })
  // `open` and `reset` stay the same functions across renders (focus and link effects use them).
  const latest = useRef(options)
  latest.current = options
  // A lookup still running when the person leaves (reset) must not navigate afterwards.
  const request = useRef(0)

  const open = useCallback(async (code: string) => {
    const mine = ++request.current
    const { isOwner, memberships, activeOrganizationId, switchFinca, replace } = latest.current
    setState({ kind: 'looking' })
    successHaptic()
    let outcome: LookupOutcome
    try {
      outcome = await findHive(code, isOwner)
    } catch {
      outcome = { kind: 'offline_unknown' }
    }
    if (mine !== request.current) return
    if (outcome.kind !== 'found') return setState({ ...outcome, code })
    if (outcome.organizationId !== activeOrganizationId) {
      await switchFinca(outcome.organizationId)
      const finca = memberships.find((m) => m.organization_id === outcome.organizationId)
      showToast(`Cambiaste a ${finca?.organization_name ?? 'otra finca'}`)
    }
    setState({ kind: 'idle' })
    const href = { pathname: '/hive/[id]', params: { id: outcome.hiveId } } as const
    if (replace) router.replace(href)
    else router.push(href)
  }, [])

  const reset = useCallback(() => {
    request.current += 1
    setState({ kind: 'idle' })
  }, [])

  return { state, open, reset }
}
