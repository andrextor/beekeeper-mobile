import type { Session } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { onMembershipsPulled } from '@/features/sync/members'
import { supabase } from '@/lib/supabase'
import { wipeLocalData } from '@/lib/wipe'
import {
  cachedMemberships,
  cacheMemberships,
  fetchMemberships,
  type Membership,
  pickActive,
  type Role,
  storeActiveOrganizationId,
  storedActiveOrganizationId,
} from './memberships'

const lastEmailKey = 'last_user_email'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | {
      status: 'signedIn'
      session: Session
      memberships: Membership[]
      activeOrganizationId: string | null
    }

type SessionContext = {
  state: AuthState
  /** Reloads `my_memberships()`; offline it keeps the cached list, unless `strict` (then it throws). */
  refreshMemberships: (strict?: boolean) => Promise<Membership[]>
  setActiveOrganization: (id: string) => Promise<void>
}

const Context = createContext<SessionContext | null>(null)

export const lastSignedInEmail = () => orElse(SecureStore.getItemAsync(lastEmailKey), null)

/** A failing local store (keystore reset, corrupted cache) must never keep the app on the splash. */
async function orElse<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

async function loadMemberships(): Promise<Membership[]> {
  try {
    return await fetchMemberships()
  } catch {
    return orElse(cachedMemberships(), [])
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const userId = useRef<string | null>(null)

  const enter = useCallback(async (session: Session, isNewSignIn: boolean) => {
    const id = session.user.id
    userId.current = id
    const email = (session.user.email ?? '').toLowerCase()
    if (isNewSignIn) {
      // Data kept after an expired session belongs to the previous person; another account starts clean.
      const previous = await orElse(SecureStore.getItemAsync(lastEmailKey), null)
      if (previous && previous.toLowerCase() !== email) await orElse(wipeLocalData(), undefined)
      await orElse(SecureStore.setItemAsync(lastEmailKey, email), undefined)
    }
    const memberships = isNewSignIn
      ? await loadMemberships()
      : await orElse(cachedMemberships(), [])
    const stored = await orElse(storedActiveOrganizationId(), null)
    // A SIGNED_OUT (or another account) that arrived during the awaits wins.
    if (userId.current !== id) return
    setState({
      status: 'signedIn',
      session,
      memberships,
      activeOrganizationId: pickActive(memberships, stored),
    })
    if (!isNewSignIn) {
      const fresh = await loadMemberships()
      if (userId.current !== id) return
      setState((s) =>
        s.status === 'signedIn'
          ? {
              ...s,
              memberships: fresh,
              activeOrganizationId: pickActive(fresh, s.activeOrganizationId),
            }
          : s,
      )
    }
  }, [])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // supabase-js warns against awaiting its own calls inside this callback.
      setTimeout(() => {
        if (!session) {
          userId.current = null
          return setState({ status: 'signedOut' })
        }
        if (userId.current !== session.user.id) {
          return void enter(session, event !== 'INITIAL_SESSION')
        }
        // Token refreshes and repeated SIGNED_IN events only swap the session.
        setState((s) => (s.status === 'signedIn' ? { ...s, session } : s))
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [enter])

  // Every full sync reloads the memberships: a lost finca or a new role shows without a restart.
  useEffect(
    () =>
      onMembershipsPulled((memberships) => {
        void orElse(cacheMemberships(memberships), undefined)
        setState((s) =>
          s.status === 'signedIn'
            ? {
                ...s,
                memberships,
                activeOrganizationId: pickActive(memberships, s.activeOrganizationId),
              }
            : s,
        )
      }),
    [],
  )

  const refreshMemberships = useCallback(async (strict = false) => {
    const memberships = strict ? await fetchMemberships() : await loadMemberships()
    setState((s) =>
      s.status === 'signedIn'
        ? {
            ...s,
            memberships,
            activeOrganizationId: pickActive(memberships, s.activeOrganizationId),
          }
        : s,
    )
    return memberships
  }, [])

  const setActiveOrganization = useCallback(async (id: string) => {
    await orElse(storeActiveOrganizationId(id), undefined)
    setState((s) => (s.status === 'signedIn' ? { ...s, activeOrganizationId: id } : s))
  }, [])

  return (
    <Context.Provider value={{ state, refreshMemberships, setActiveOrganization }}>
      {children}
    </Context.Provider>
  )
}

export function useSession(): SessionContext {
  const context = useContext(Context)
  if (!context) throw new Error('useSession outside SessionProvider')
  return context
}

/** Role in the active finca; the UI hides what RLS would refuse, the server still decides. */
export function useRole(): Role | null {
  const { state } = useSession()
  if (state.status !== 'signedIn') return null
  return (
    state.memberships.find((m) => m.organization_id === state.activeOrganizationId)?.role ?? null
  )
}

/**
 * Explicit sign-out. supabase-js drops the local session even when the server call fails
 * (no signal), so this person's data is erased either way.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
  await wipeLocalData()
}
