import { router } from 'expo-router'
import { useCallback, useState } from 'react'

import { showToast } from '@/components/ui/ToastHost'
import { successHaptic } from '@/lib/haptics'
import { findHive } from './find'
import type { LookupOutcome } from './lookup'

export type LookupState =
  | { kind: 'idle' }
  | { kind: 'looking' }
  | (Exclude<LookupOutcome, { kind: 'found' }> & { code: string })

type Options = {
  isOwner: boolean
  activeOrganizationId: string | null
  /** Finca name for "Cambiaste a …"; routes pass the session's memberships. */
  fincaName: (organizationId: string) => string
  switchFinca: (organizationId: string) => Promise<void>
  /** The deep link replaces itself with the hive; the scanner pushes it. */
  replace?: boolean
}

/** Scanner and deep link: find the code, switch finca if needed, open the hive or say why not. */
export function useCodeLookup(options: Options) {
  const [state, setState] = useState<LookupState>({ kind: 'idle' })

  const open = async (code: string) => {
    setState({ kind: 'looking' })
    successHaptic()
    let outcome: LookupOutcome
    try {
      outcome = await findHive(code, options.isOwner)
    } catch {
      outcome = { kind: 'offline_unknown' }
    }
    if (outcome.kind !== 'found') return setState({ ...outcome, code })
    if (outcome.organizationId !== options.activeOrganizationId) {
      await options.switchFinca(outcome.organizationId)
      showToast(`Cambiaste a ${options.fincaName(outcome.organizationId)}`)
    }
    setState({ kind: 'idle' })
    const href = { pathname: '/hive/[id]', params: { id: outcome.hiveId } } as const
    if (options.replace) router.replace(href)
    else router.push(href)
  }

  const reset = useCallback(() => setState({ kind: 'idle' }), [])
  return { state, open, reset }
}
